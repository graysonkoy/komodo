import { getClipInfos } from "./twitchController";
import { downloadAndUploadVideo } from "../services/youtubeDl";
import validateQuery from "../util/validateQuery";
import s3 from "../services/s3";
import lambda from "../services/lambda";
import fs from "fs";

export async function getVideos(clipInfos) {
	await Promise.all(
		clipInfos.map(async (clip) => {
			if (clip.source != "twitch") {
				// got the clip from mongo, check if it's downloaded in S3 already
				if (await s3.clipExists(clip.slug)) return;
			}

			// didn't get the video from S3, download & store it
			console.log(`Downloading video '${clip.slug}' from Twitch`);
			await downloadAndUploadVideo(clip);
		})
	);
}

export async function makeVideo(req, res) {
	let { clips } = validateQuery(req);
	clips = JSON.parse(clips);

	console.log("Getting clip informations");
	const clipInfos = await getClipInfos(clips);
	console.log("Done getting clip informations");

	console.log("Getting videos");
	await getVideos(clipInfos);
	console.log("Done getting videos");

	console.log("Merging videos");
	const mergedName = clipInfos.map((clip) => clip.slug).join("+");

	if (await s3.mergedVideoExists(mergedName)) {
		console.log("Clips previously merged");
	} else {
		console.log("Clips haven't been merged, calling Lambda");

		const lambdaRes = await lambda.call("Komodo-merger", {
			inputBucket: process.env.S3_BUCKET_NAME_CLIPS,
			outputBucket: process.env.S3_BUCKET_NAME_MERGED,
			clips: clipInfos,
			mergedName,
		});

		console.log(lambdaRes);
		const lambdaJSON = JSON.parse(lambdaRes.Payload.toString());
		console.log("Lambda finished", lambdaJSON);

		if (lambdaJSON.statusCode != 200) throw new Error(lambdaJSON.Body);
	}

	console.log("Streaming merged video to client");
	const mergedVideoBuffer = await s3.getMergedVideo(mergedName);

	return res.send(mergedVideoBuffer);
}
