import s3 from "./s3";
import execa from "execa";

export async function downloadAndUploadVideo(clip) {
	const process = execa("yt-dlp", [clip.info.url, "-o", "-"]);

	await s3.uploadStream(clip.slug, process.stdout);

	console.log("Uploaded to S3");
}
