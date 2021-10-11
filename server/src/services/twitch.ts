import axios from "axios";

export function extractSlug(url) {
	if (!url.includes("https://www.twitch.tv/")) throw "Invalid clip url";
	return url.split("/").pop();
}

const twitchHeaders = () => ({
	headers: {
		Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
		"Client-ID": `${process.env.TWITCH_CLIENT_ID}`,
	},
});

export async function getClipInfo(slugs) {
	const request = await axios.get("https://api.twitch.tv/helix/clips", {
		...twitchHeaders(),
		params: {
			id: slugs,
		},
	});

	if (request.data.data.length !== slugs.length)
		throw "One or more clips failed to load";

	return request.data.data;
}

export async function getGameId(gameName) {
	if (!gameName) return null;

	const request = await axios.get("https://api.twitch.tv/helix/games", {
		...twitchHeaders(),
		params: {
			name: gameName,
		},
	});

	return request.data.data[0].id;
}

export async function getStreamerId(streamerName) {
	if (!streamerName) return null;

	const request = await axios.get("https://api.twitch.tv/helix/users", {
		...twitchHeaders(),
		params: {
			login: streamerName,
		},
	});

	return request.data.data[0].id;
}

export async function getTopClips(gameName, streamerName, startDate, clips) {
	const gameId = await getGameId(gameName);
	const streamerId = await getStreamerId(streamerName);

	try {
		const request = await axios.get("https://api.twitch.tv/helix/clips", {
			...twitchHeaders(),
			params: {
				game_id: gameId,
				broadcaster_id: streamerId,
				started_at: startDate,
				ended_at: new Date(),
				first: clips,
			},
		});

		return request.data.data;
	} catch (e) {
		console.log(e);
		throw e;
	}
}
