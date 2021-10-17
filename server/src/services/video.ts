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
		fontFile: "fonts/PlusJakartaSans-Regular.ttf",
		titleFontFile: "fonts/PlusJakartaSans-Bold.ttf",
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
				[
					// as far as i know you can't combine multiple filters in fluent-ffmpeg, so this is the best i could do.
					...videos.map((video, i) => [
						{
							// set resolution
							inputs: `[${i}:0]` /* this is the first filter, and it takes in the [:0] stream of a video, which is the video stream
																		so essentially this code just means 'use the video portion of video i as input'*/,
							filter: "scale",
							options: videoOptions.resolution,
							outputs: `[v${i}1]`, // we apply the filter to the input and then output it into a new stream, '[v{i}1]'.
						},
						{
							// set aspect ratio
							inputs: `[v${i}1]` /* now, instead of using the video stream of the original clip as input,
																		we're using the modified output video stream from the last filter */,
							filter: "setsar",
							options: 1,
							outputs: `[v${i}2]`, // and after applying this second filter we output it into another.
						},
						{
							// set fps
							inputs: `[v${i}2]`,
							filter: "fps",
							options: videoOptions.fps,
							outputs: `[v${i}3]`,
						},
						{
							// streamer name text
							inputs: `[v${i}3]`,
							filter: "drawtext",
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
							outputs: `[v${i}4]`,
						},
						{
							// clip name text
							inputs: `[v${i}4]`,
							filter: "drawtext",
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
							outputs: `[v${i}5]`,
						},
					]),
					// all the individual filters are done, concatenate the clips
					{
						inputs: videos.map((video, i) => `[v${i}5][${i}:1]`), // final [v{i}x] video streams, and the original audio streams
						filter: "concat",
						options: {
							n: videos.length,
							v: 1,
							a: 1,
						},
						outputs: ["[v]", "[a]"],
					},
				],
				["[v]", "[a]"] // we want to use these as the final streams.
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
