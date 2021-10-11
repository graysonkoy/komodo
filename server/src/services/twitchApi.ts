import axios from "axios";

export function extractSlug(url) {
	if (!url.includes("https://www.twitch.tv/")) throw "Invalid clip url";
	return url.split("/").pop();
}

export async function getClipInfo(slugs) {
	const request = await axios.get(
		`https://api.twitch.tv/helix/clips?id=${slugs}`,
		{
			headers: {
				Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
				"Client-ID": `${process.env.TWITCH_CLIENT_ID}`,
			},
		}
	);

	if (request.data.data.length !== slugs.length)
		throw "One or more clips failed to load";

	return request.data.data;
}
