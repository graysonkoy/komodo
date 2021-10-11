import express, { response, Router } from "express";
import validateQuery from "../util/validateQuery";

export async function makeVideo(req, res) {
	const { links } = validateQuery(req);

	return res.json({ json: "HELLO" });
}
