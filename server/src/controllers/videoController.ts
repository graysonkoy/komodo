import express, { request, response, Router } from "express";
import fs from "fs-extra";
import { getVideo } from "../services/youtubeDl";
import { extractSlug, getClipInfo } from "../services/twitchApi";
import validateQuery from "../util/validateQuery";
import { combineClips } from "../services/video";

import db from "../services/mongo";
import s3 from "../services/s3";
import path from "path";

async function getClipInfos(urls) {
	const slugs = urls.map((url) => extractSlug(url));

	let clipInfos = [],
		unavailableSlugs = [];

	// get information from mongo if possible
	await Promise.all(
		slugs.map(async (slug) => {
			const info = await db.getClipData(slug);
			if (info) {
				console.log(`Got info for clip '${slug}' from Mongo`);

				clipInfos.push({
					source: "mongo",
					slug,
					info,
				});
			} else {
				// need to get information from twitch
				unavailableSlugs.push(slug);
			}
		})
	);

	// get unavailable information from the twitch api
	if (unavailableSlugs.length != 0) {
		const infos = await getClipInfo(unavailableSlugs);

		await Promise.all(
			infos.map(async (info) => {
				// store in mongo
				await db.storeClipData(info.id, info);
				console.log(`Added information for clip ${info.id} to mongo`);

				clipInfos.push({
					source: "twitch",
					slug: info.id,
					info,
				});
			})
		);
	}

	return clipInfos;
}

async function getVideos(clipInfos) {
	await Promise.all(
		clipInfos.map(async (clip) => {
			clip.filename = path.join(
				__dirname,
				`../../clips/downloaded/${clip.slug}.mp4`
			);

			if (fs.existsSync(clip.filename)) return;

			if (clip.source == "mongo") {
				// got the clip from mongo, check if it's downloaded in S3 already
				const video = await s3.getVideo(clip.slug);
				if (video) {
					await fs.writeFile(clip.filename, video);
					console.log(`Got video '${clip.slug}' from S3`);
					return;
				}
			}

			// didn't get the video from S3, download & store it
			console.log(`Getting video '${clip.slug}' from Twitch`);
			const filename = await getVideo(clip.info.url, clip.filename);

			await s3.storeVideo(clip.slug, filename);
			console.log(`Uploaded video '${clip.slug}' to S3`);
		})
	);

	return clipInfos;
}

export async function makeVideo(req, res) {
	const clips = JSON.parse(req.query.clips);

	console.log("Getting clip informations");
	const clipInfos = await getClipInfos(clips);
	console.log("Done getting clip informations");

	console.log("Getting videos");
	const videos = await getVideos(clipInfos);
	console.log("Done getting videos");

	console.log("Merging clips");
	const mergedFilename = await combineClips(videos);
	console.log("Done merging");

	await res.sendFile(mergedFilename);

	// delete videos
	for await (const video of videos) {
		await fs.remove(video.filename);
	}

	// delete merged video
	await fs.remove(mergedFilename);
}
