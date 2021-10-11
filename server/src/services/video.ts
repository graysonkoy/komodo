import fs from "fs-extra";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

export async function combineClips(clipList: Array<string>) {
	if (clipList.length == 0) throw "No clips provided";

	// const filenames = clipList.map(clip => clip);
	const filenames = clipList;

	let mergedVideo = ffmpeg();

	// add all of the clips
	filenames.forEach((file) => {
		mergedVideo = mergedVideo.input(file);
	});

	const write = (outputFilename: string) => {
		return new Promise((resolve, reject) => {
			mergedVideo
				.on("end", () => resolve(outputFilename))
				.on("progress", (progress) => console.log(progress))
				.on("error", (err) => {
					console.log(err);
					throw err.message;
				})
				.mergeToFile(outputFilename);
		});
	};

	await write(path.join(__dirname, "../output/mergedVideo.mp4"));

	console.log("Done");
}
