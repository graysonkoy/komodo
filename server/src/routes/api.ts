import express from "express";
import { query } from "express-validator";

import * as videoController from "../controllers/videoController";
import * as twitchController from "../controllers/twitchController";

const apiRouter = express.Router();

apiRouter.get(
	"/getClips",
	query("gameName").optional().isString(),
	query("streamerName").optional().isString(),
	query("startDate").optional(), // todo: isDate
	query("clips").optional().isInt({ min: 1, max: 100 }).default(20),
	twitchController.getClips
);

apiRouter.get("/makeVideo", query("clips"), videoController.makeVideo);

export default apiRouter;
