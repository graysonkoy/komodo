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
	for await (const slug of slugs) {
		const info = await db.getClipData(slug);
		if (info) {
			clipInfos.push({
				source: "mongo",
				slug,
				info,
			});
		} else {
			// need to get information from twitch
			unavailableSlugs.push(slug);
		}
	}

	// get unavailable information from the twitch api
	if (unavailableSlugs.length != 0) {
		const infos = await getClipInfo(unavailableSlugs);

		for await (const info of infos) {
			// store in mongo
			await db.storeClipData(info.id, info);
			console.log(`Added information for clip ${info.id} to mongo`);

			clipInfos.push({
				source: "twitch",
				slug: info.id,
				info,
			});
		}
	}

	return clipInfos;
}

async function getVideos(clipInfos) {
	for await (let clip of clipInfos) {
		clip.filename = path.join(
			__dirname,
			`../../clips/downloaded/${clip.slug}.mp4`
		);

		if (clip.source == "mongo") {
			// got the clip from mongo, check if it's downloaded in S3 already
			const video = await s3.getVideo(clip.slug);
			if (video) {
				await fs.writeFile(clip.filename, video);
				console.log(`Got video '${clip.slug}' from s3`);
				continue;
			}
		}

		// didn't get the video from S3, download & store it
		console.log(`Getting video '${clip.slug}' from Twitch`);
		const filename = await getVideo(clip.info.url, clip.filename);

		await s3.storeVideo(clip.slug, filename);
		console.log(`Uploaded video '${clip.slug}' to S3`);
	}

	return clipInfos.map((clip) => clip.filename);
}

export async function makeVideo(req, res) {
	try {
		const clips = JSON.parse(req.query.clips);

		const clipInfos = await getClipInfos(clips);

		const videoFilenames = await getVideos(clipInfos);

		const mergedFilename = await combineClips(videoFilenames);

		console.log("Sending video");
		res.sendFile(mergedFilename);

		for await (const filename of videoFilenames) {
			await fs.remove(filename);
		}

		await fs.remove(mergedFilename);
	} catch (error) {
		console.error(error);
		throw `Failed to get a video`;
	}
}
