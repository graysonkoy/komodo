import path from "path";
import YoutubeDlWrap from "youtube-dl-wrap";

const youtubeDl = new YoutubeDlWrap(path.join(__dirname, "youtube-dl.exe"));

export async function getVideo(url, slug) {
	const outputPath = path.join(__dirname, `../downloaded/${slug}.mp4`);

	const file = await youtubeDl.execPromise([url, "-o", outputPath], {
		writeInfoJson: true,
	});

	return file;
}
