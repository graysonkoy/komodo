import fs from "fs-extra";
import path from "path";
import randomString from "../util/randomString";
import child_process from "child_process";

async function exec(command) {
	return new Promise<void>((resolve, reject) => {
		const child = child_process.exec(command);

		child.stdout.pipe(process.stdout);

		child.on("exit", () => resolve());
		child.on("error", () => reject());
	});
}

export async function combineClips(clipList: Array<string>) {
	if (clipList.length == 0) throw "No clips provided";

	const id = randomString();

	const mergedFilename = path.join(__dirname, `../../clips/merged/${id}.mp4`);
	const clipsFilename = path.join(
		__dirname,
		`../../clips/downloaded/clips-${id}.txt`
	);

	await fs.writeFile(
		clipsFilename,
		clipList.map((filename) => `file '${filename}'`).join("\n")
	);

	await exec(`ffmpeg -safe 0 -f concat -i ${clipsFilename} ${mergedFilename}`);

	await fs.remove(clipsFilename);

	return mergedFilename;
}
