import execa from "execa";

export async function downloadVideo(url, outputPath) {
	await execa("yt-dlp", [url, "-o", outputPath]);
}
