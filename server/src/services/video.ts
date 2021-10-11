import fs from "fs-extra";
import path from "path";
import child_process from "child_process";

import randomString from "../util/randomString";

function slash(path) {
	const isExtendedLengthPath = /^\\\\\?\\/.test(path);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return path;
	}

	return path.replace(/\\/g, "/");
}

async function exec(command) {
	return new Promise<void>((resolve, reject) => {
		const child = child_process.exec(command);

		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);

		child.on("exit", () => resolve());
		child.on("error", () => reject());
	});
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
		lineGap: 39,
		fontFile: "fonts/OpenSans-Regular.ttf",
		titleFontFile: "fonts/OpenSans-Bold.ttf",
	};

	const filters = [];
	for await (const video of videos) {
		const videoResFilter = `scale=${videoOptions.resolution},setsar=1,fps=${videoOptions.fps}`; // all of the videos have to be the same resolution and fps when concatenating

		const clipTitleFilter = [
			`drawtext=enable='between(t,0,${subtitleOptions.duration})'`,
			`fontfile=${subtitleOptions.titleFontFile}`,
			`text='${video.info.title}'`,
			`fontcolor=white`,
			`fontsize=${subtitleOptions.fontSize}`,
			`box=1`,
			`boxcolor=black@${subtitleOptions.backgroundOpacity}`,
			`boxborderw=${subtitleOptions.backgroundPadding}`,
			`x=${subtitleOptions.cornerGap}`,
			`y=(h-text_h)-${subtitleOptions.cornerGap}-${
				subtitleOptions.backgroundPadding * 2
			}-${subtitleOptions.lineGap}`,
		].join(":");

		const streamerNameFilter = [
			`drawtext=enable='between(t,0,${subtitleOptions.duration})'`,
			`fontfile=${subtitleOptions.fontFile}`,
			`text='${video.info.broadcaster_name}'`,
			`fontcolor=white@1`,
			`fontsize=${subtitleOptions.fontSize}`,
			`box=1`,
			`boxcolor=black@${subtitleOptions.backgroundOpacity}`,
			`boxborderw=${subtitleOptions.backgroundPadding}`,
			`x=${subtitleOptions.cornerGap}`,
			`y=(h-text_h)-${subtitleOptions.cornerGap}`,
		].join(":");

		filters.push(
			[videoResFilter, clipTitleFilter, streamerNameFilter].join(",")
		);
	}

	const filterComplex = [
		// add filters to the video streams
		`${videos
			.map(
				(video, i) =>
					`[${i}:0]` + // i-th input video stream. (0: video, 1: audio)
					`${filters[i]}` + // insert the filters for this input
					`[v${i}];` // output to [vi]
			)
			.join("")}`,

		// merge all of the streams
		`${videos
			.map(
				(video, i) => `[v${i}][${i}:1]` // [vi] and [i:1] - filtered video and original audio
			)
			.join("")}concat=n=${videos.length}:v=1:a=1 [v][a]"`, // concatenate them all into [v] and [a]
	].join(" ");

	const command = [
		`ffmpeg`,

		`${videos.map((video) => `-i ${video.filename}`).join(" ")}`,

		`-filter_complex "${filterComplex}`,
		`-map "[v]" -map "[a]"`, // we want the filtered and concatenated video and audio

		`-preset ultrafast`,
		`${mergedFilename}`,
	].join(" ");

	console.log(command);

	await exec(command);

	if ((await fs.readFile(mergedFilename)).length == 0)
		throw "Failed to render video";

	return mergedFilename;
}
