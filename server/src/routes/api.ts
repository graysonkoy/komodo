import express from "express";
import { query } from "express-validator";

import * as videoController from "../controllers/videoController";

const apiRouter = express.Router();

apiRouter.get("/test", query("clips").isArray(), videoController.makeVideo);

export default apiRouter;
