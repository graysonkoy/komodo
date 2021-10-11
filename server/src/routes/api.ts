import express from "express";

import * as videoController from "../controllers/videoController";

const apiRouter = express.Router();

apiRouter.get("/makeVideo", videoController.makeVideo);

export default apiRouter;
