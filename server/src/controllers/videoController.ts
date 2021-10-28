import fs from "fs-extra";
import path from "path";

import { getClipInfos } from "./twitchController";
import { combineClips } from "../services/video";
import { downloadVideo } from "../services/youtubeDl";
import validateQuery from "../util/validateQuery";
import s3 from "../services/s3";
import { clipsFolder } from "../index";

export async function getVideos(clipInfos) {
	await Promise.all(
		clipInfos.map(async (clip) => {
			clip.filename = path.join(clipsFolder, `downloaded/${clip.slug}.mp4`);

			if (fs.existsSync(clip.filename)) return;

			if (clip.source != "twitch") {
				// got the clip from mongo, check if it's downloaded in S3 already
				const video = await s3.getVideo(clip.slug);
				if (video) {
					await fs.writeFile(clip.filename, video);
					console.log(`Got video '${clip.slug}' from S3`);
					return;
				}
			}

			// didn't get the video from S3, download & store it
			console.log(`Downloading video '${clip.slug}' from Twitch`);
			await downloadVideo(clip.info.url, clip.filename);
			console.log(`Downloaded video '${clip.slug}' from Twitch`);

			// don't wait to store the video, just do it in the background
			s3.storeVideo(clip.slug, clip.filename).then(() =>
				console.log(`Uploaded video '${clip.slug}' to S3`)
			);
		})
	);

	return clipInfos;
}

export async function makeVideo(req, res) {
	let { clips } = validateQuery(req);
	clips = JSON.parse(clips);

	console.log("Getting clip informations");
	const clipInfos = await getClipInfos(clips);
	console.log("Done getting clip informations");

	console.log("Getting videos");
	const videos = await getVideos(clipInfos);
	console.log("Done getting videos");

	console.log("Merging clips");
	const mergedFilename = await combineClips(videos);
	console.log("Done merging");

	res.sendFile(mergedFilename);

	// delete videos
	for await (const video of videos) {
		await fs.remove(video.filename);
	}

	// delete merged video
	await fs.remove(mergedFilename);
}
