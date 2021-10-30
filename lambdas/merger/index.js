const ffmpeg = require("fluent-ffmpeg");
const stream = require("stream");
const AWS = require("aws-sdk");
const fs = require("fs");

exports.handler = async (event) => {
	try {
		const { inputBucket, outputBucket, clips } = event;
		if (!inputBucket) throw "No input bucket provided";
		if (!outputBucket) throw "No output bucket provided";
		if (!clips || clips.length == 0) throw "No clips provided";

		const mergedKey = clips.map((clip) => clip.slug).join("+");
		const s3 = new AWS.S3();

		const videoOptions = {
			resolution: "1280:720",
			fps: 30,
		};

		const subtitleOptions = {
			duration: 5,
			fontSize: 45,
			lineHeight: 25,
			lineGap: 45,
			cornerGap: 50,
			backgroundOpacity: 0.5,
			backgroundPadding: 17,
			fontName: "fonts/PlusJakartaSans-Regular.ttf",
			titleFontName: "fonts/PlusJakartaSans-Bold.ttf",
			fade: {
				in: 0.2,
				out: 0.5,
			},
		};

		// prettier-ignore
		const fadeString = `if(
			lt(t,${subtitleOptions.fade.in}),
			t/${subtitleOptions.fade.in},
			if(
				lt(t,${subtitleOptions.duration + subtitleOptions.fade.in}),
				1,
				if(
					lt(t,${subtitleOptions.duration + subtitleOptions.fade.in + subtitleOptions.fade.out}),
					(${subtitleOptions.fade.out}-(t-${subtitleOptions.duration + subtitleOptions.fade.in}))/${subtitleOptions.fade.out},
					0
				)
			)
		)`.replace(/\s/g,'');

		const wrapString = (str, width) =>
			str
				.replace(
					new RegExp(
						`(?:\\S(?:.{0,${width}}\\S)?(?:\\s+|-|$)|(?:\\S{${width}}))`,
						"g"
					),
					(s) => `${s}\n`
				)
				.slice(0, -1);

		let proc = ffmpeg();

		// add inputs
		for await (const clip of clips) {
			const clipUrl = await s3.getSignedUrlPromise("getObject", {
				Bucket: inputBucket,
				Key: clip.slug,
			});

			proc = proc.input(clipUrl);
		}

		// add general options
		proc = proc.addOption(["-preset", "ultrafast"]);

		// add filters
		const filters = [
			// as far as i know you can't combine multiple filters in fluent-ffmpeg, so this is the best i could do.
			...clips
				.map((clip, i) => [
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
							enable: `between(t,0,${
								subtitleOptions.duration +
								subtitleOptions.fade.in +
								subtitleOptions.fade.out
							})`,
							alpha: fadeString,
							fontfile: subtitleOptions.fontFile,
							text: clip.info.broadcaster_name,
							fontcolor: "white@1",
							fontsize: subtitleOptions.fontSize,
							line_spacing: subtitleOptions.lineHeight,
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
							enable: `between(t,0,${
								subtitleOptions.duration +
								subtitleOptions.fade.in +
								subtitleOptions.fade.out
							})`,
							alpha: fadeString,
							fontfile: subtitleOptions.titleFontFile,
							text: wrapString(
								clip.info.title.replace('"', '\\"').replace("'", "\u2019"),
								30
							),
							fontcolor: "white@1",
							fontsize: subtitleOptions.fontSize,
							line_spacing: subtitleOptions.lineHeight,
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
				])
				.flat(),
			// all the individual filters are done, concatenate the clips
			{
				inputs: clips.map((video, i) => `[v${i}5][${i}:1]`), // final [v{i}x] video streams, and the original audio streams
				filter: "concat",
				options: {
					n: clips.length,
					v: 1,
					a: 1,
				},
				outputs: ["[v]", "[a]"],
			},
		];

		proc = proc.complexFilter(
			filters,
			["[v]", "[a]"] // we want to use these as the final streams.
		);

		const writeStream = new stream.PassThrough();

		console.log("starting ffmpeg");

		proc
			.outputOptions(["-movflags isml+frag_keyframe"])
			.format("mp4")
			.on("start", (commandLine) =>
				console.log("spawned ffmpeg with command: ", commandLine)
			)
			.on("progress", (progress) => console.log("ffmpeg progress: ", progress))
			.on("error", (error) => console.log(error))
			.pipe(writeStream, { end: true });

		console.log("starting s3 upload");

		await s3
			.upload({
				Bucket: outputBucket,
				Key: mergedKey,
				Body: writeStream,
			})
			.promise();

		console.log("done!");

		return {
			statusCode: 200,
			Body: mergedKey,
		};
	} catch (e) {
		console.log(e);
		return {
			statusCode: 500,
			Body: e,
		};
	}
};
