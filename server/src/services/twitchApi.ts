import axios from "axios";

export async function getClipInfo(url) {
	if (!url.includes("https://www.twitch.tv/")) throw "Invalid clip url";

	const slug = url.split("/").pop();

	const request = await axios.get(
		`https://api.twitch.tv/helix/clips?id=${slug}`,
		{
			headers: {
				Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
				"Client-ID": `${process.env.TWITCH_CLIENT_ID}`,
			},
		}
	);

	if (!request.data.slug) throw "Clip doesn't exist";

	return request.data;
}
