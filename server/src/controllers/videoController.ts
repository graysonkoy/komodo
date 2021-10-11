import express, { request, response, Router } from "express";
import { getVideo } from "../services/ytubedl";
import { getClipInfo } from "../services/twitchApi";
import validateQuery from "../util/validateQuery";
import { combineClips } from "../services/video";

async function getVideos(urls) {
	try 
	{
		const videoInformation = await getClipInfo(urls);
		const promises = await Promise.all(urls.map(url => {return getVideo(url)}))
		
		const returnData = [];
		urls.forEach((url, index) => {
			returnData.push({
				information: videoInformation[index],
				filePath: promises[index]
			})
		});

		return returnData
	}

	catch(error) 
	{
		console.log(error);
		throw `Failed to get a video`;
	}
}

export async function makeVideo(req, res) {
	const clips = JSON.parse(req.query.clips)
	const videoInformation = await getVideos(clips)

	const filePaths = videoInformation.map(video => {return video.filePath});
	await combineClips(filePaths);
}
