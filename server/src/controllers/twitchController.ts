import { extractSlug, getClipInfo, getTopClips } from "../services/twitch";
import validateQuery from "../util/validateQuery";
import db from "../services/mongo";

export async function getClipInfos(urls) {
	const slugs = urls.map((url) => extractSlug(url));

	let clipInfos = [],
		unavailableSlugs = [];

	// get information from mongo if possible
	await Promise.all(
		slugs.map(async (slug) => {
			const info = await db.getClipData(slug);
			if (info) {
				console.log(`Got info for clip '${slug}' from Mongo`);

				clipInfos.push({
					source: "mongo",
					slug,
					info,
				});
			} else {
				// need to get information from twitch
				unavailableSlugs.push(slug);
			}
		})
	);

	// get unavailable information from the twitch api
	if (unavailableSlugs.length != 0) {
		const infos = await getClipInfo(unavailableSlugs);

		await Promise.all(
			infos.map(async (info) => {
				// store in mongo
				await db.storeClipData(info.id, info);
				console.log(`Added information for clip ${info.id} to mongo`);

				clipInfos.push({
					source: "twitch",
					slug: info.id,
					info,
				});
			})
		);
	}

	return clipInfos;
}

export async function getSingleClipInfo(req, res) {
	const { clip } = validateQuery(req);

	const clipInfo = (await getClipInfos([clip]))[0];

	return res.json({
		data: clipInfo.info,
	});
}

export async function getClips(req, res) {
	const {
		gameName,
		streamerName,
		startDate: startDateString,
		clips,
	} = validateQuery(req);

	if (!gameName && !streamerName)
		throw "A gameName or streamerName is required.";
	else if (gameName && streamerName)
		throw "Only a gameName or a streamerName can be provided, not both.";

	// todo: remove this, use validator
	let startDate;
	if (startDateString) {
		if (!Date.parse(startDateString)) throw "Invalid start date";
		startDate = new Date(startDateString);
	}

	const clipInfos = await getTopClips(gameName, streamerName, startDate, clips);

	return res.json({
		data: clipInfos,
	});
}
