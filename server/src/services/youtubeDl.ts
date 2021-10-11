import path from "path";
import YoutubeDlWrap from "youtube-dl-wrap";

const binary = path.join(__dirname, "youtube-dl.exe");
const youtubeDlWrap = new YoutubeDlWrap(binary);

export async function getVideo(url, outputPath) {
	try {
		await youtubeDlWrap.execPromise([url, "-o", outputPath], {
			writeInfoJson: true,
		});

		return outputPath;
	} catch (error) {
		console.log(error);
	}
}
