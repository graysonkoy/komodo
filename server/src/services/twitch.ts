import axios from "axios";

async function twitch(endpoint, params) {
	try {
		const resp = await axios.get(`https://api.twitch.tv/helix/${endpoint}`, {
			headers: {
				Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
				"Client-ID": `${process.env.TWITCH_CLIENT_ID}`,
			},
			params,
		});

		return resp.data.data;
	} catch (e) {
		console.log(e);
		throw `Twitch API call to /${endpoint} failed`;
	}
}

export function extractSlug(url) {
	if (!url.includes("twitch.tv")) throw "Invalid clip url";
	return url.split("/").pop();
}

export async function getClipInfo(slugs) {
	const data = await twitch("clips", {
		id: slugs,
	});

	if (data.length !== slugs.length) throw "One or more clips failed to load";

	return data;
}

export async function getGameId(gameName) {
	if (!gameName) return null;

	const data = await twitch("games", {
		name: gameName,
	});

	return data[0].id;
}

export async function getStreamerId(streamerName) {
	if (!streamerName) return null;

	const data = await twitch("users", {
		login: streamerName,
	});

	return data[0].id;
}

export async function getTopClips(gameName, streamerName, startDate, clips) {
	const gameId = await getGameId(gameName);
	const streamerId = await getStreamerId(streamerName);

	try {
		const data = await twitch("clips", {
			game_id: gameId,
			broadcaster_id: streamerId,
			started_at: startDate,
			ended_at: new Date(),
			first: clips,
		});

		return data;
	} catch (e) {
		console.log(e);
		throw e;
	}
}
