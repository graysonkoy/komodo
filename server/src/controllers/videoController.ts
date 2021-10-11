import fs from "fs-extra";
import path from "path";

import { getClipInfos } from "./twitchController";
import { combineClips } from "../services/video";
import { downloadVideo } from "../services/youtubeDl";
import validateQuery from "../util/validateQuery";
import s3 from "../services/s3";

export async function getVideos(clipInfos) {
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
			const filename = await downloadVideo(clip.info.url, clip.filename);

			await s3.storeVideo(clip.slug, filename);
			console.log(`Uploaded video '${clip.slug}' to S3`);
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

	await res.sendFile(mergedFilename);

	// delete videos
	for await (const video of videos) {
		await fs.remove(video.filename);
	}

	// delete merged video
	await fs.remove(mergedFilename);
}
