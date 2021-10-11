import fs from "fs-extra";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

import randomString from "../util/randomString";

function slash(path) {
	const isExtendedLengthPath = /^\\\\\?\\/.test(path);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return path;
	}

	return path.replace(/\\/g, "/");
}

export async function combineClips(videos) {
	if (videos.length == 0) throw "No clips provided";

	const id = randomString();

	const mergedFilename = path.join(__dirname, `../../clips/merged/${id}.mp4`);
	const clipsFilename = path.join(
		__dirname,
		`../../clips/downloaded/clips-${id}.txt`
	);

	const videoOptions = {
		resolution: "1280:720",
		fps: 30,
	};

	const subtitleOptions = {
		duration: 5,
		fontSize: 45,
		cornerGap: 50,
		backgroundOpacity: 0.5,
		backgroundPadding: 17,
		lineGap: 45,
		fontFile: "fonts/OpenSans-Regular.ttf",
		titleFontFile: "fonts/OpenSans-Bold.ttf",
	};

	const runFfmpeg = () => {
		return new Promise<void>((resolve, reject) => {
			let proc = ffmpeg();

			// add inputs
			videos.forEach((video) => (proc = proc.input(video.filename)));

			// add general options
			proc = proc.addOption(["-preset", "ultrafast"]);

			// add filters
			proc = proc.complexFilter(
				// as far as i know you can't combine multiple filters in fluent-ffmpeg, so this is the best i could do
				[
					// set resolution
					...videos.map((video, i) => ({
						filter: "scale",
						inputs: `[${i}:0]`,
						outputs: `[v${i}1]`,
						options: videoOptions.resolution,
					})),
					// set aspect ratio
					...videos.map((video, i) => ({
						filter: "setsar",
						inputs: `[v${i}1]`,
						outputs: `[v${i}2]`,
						options: 1,
					})),
					// set fps
					...videos.map((video, i) => ({
						filter: "fps",
						inputs: `[v${i}2]`,
						outputs: `[v${i}3]`,
						options: videoOptions.fps,
					})),
					// streamer name text
					...videos.map((video, i) => ({
						filter: "drawtext",
						inputs: `[v${i}3]`,
						outputs: `[v${i}4]`,
						options: {
							enable: `between(t,0,${subtitleOptions.duration})`,
							fontfile: subtitleOptions.fontFile,
							text: video.info.broadcaster_name,
							fontcolor: "white@1",
							fontsize: subtitleOptions.fontSize,
							box: 1,
							boxcolor: `black@${subtitleOptions.backgroundOpacity}`,
							boxborderw: subtitleOptions.backgroundPadding,
							x: subtitleOptions.cornerGap,
							y: `(h-text_h)-${subtitleOptions.cornerGap}`,
						},
					})),
					// clip name text
					...videos.map((video, i) => ({
						filter: "drawtext",
						inputs: `[v${i}4]`,
						outputs: `[v${i}5]`,
						options: {
							enable: `between(t,0,${subtitleOptions.duration})`,
							fontfile: subtitleOptions.titleFontFile,
							text: video.info.title.replace('"', '"'),
							fontcolor: "white@1",
							fontsize: subtitleOptions.fontSize,
							box: 1,
							boxcolor: `black@${subtitleOptions.backgroundOpacity}`,
							boxborderw: subtitleOptions.backgroundPadding,
							x: subtitleOptions.cornerGap,
							y: `(h-text_h)-${subtitleOptions.cornerGap}-${
								subtitleOptions.backgroundPadding * 2
							}-${subtitleOptions.lineGap}`,
						},
					})),
					// concatenate the clips
					{
						filter: "concat",
						inputs: videos.map((video, i) => `[v${i}5][${i}:1]`),
						outputs: ["[v]", "[a]"],
						options: {
							n: videos.length,
							v: 1,
							a: 1,
						},
					},
				],
				["[v]", "[a]"]
			);

			proc
				.save(mergedFilename)
				.on("start", (commandLine) =>
					console.log("spawned ffmpeg with command: ", commandLine)
				)
				.on("progress", (progress) =>
					console.log("ffmpeg progress: ", progress)
				)
				.on("error", reject)
				.on("end", resolve);
		});
	};

	await runFfmpeg();

	if ((await fs.readFile(mergedFilename)).length == 0)
		throw "Failed to render video";

	return mergedFilename;
}
