import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import path from "path";
import fs from "fs-extra";
import "express-async-errors";

import db from "./services/mongo";
import s3 from "./services/s3";

import apiRouter from "./routes/api";

import statusCodes from "./util/statusCodes";

// setup
const app = express();

const port = process.env.PORT || 3001;
const env = process.env.NODE_ENV || "development";

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("tiny"));
app.use(
	helmet({
		contentSecurityPolicy: false,
	})
);

// handle server routes
app.use("/api", apiRouter);

// serve react app (production)
if (env == "production") {
	const root = path.join(__dirname, "client");

	app.use(express.static(root));
	app.get("*", (req, res) => {
		res.sendFile("index.html", { root });
	});
}

// error handlers
app.use((req: Request, res: Response, next: NextFunction) => {
	// 404s
	res.status(statusCodes.NOT_FOUND).json({
		error: true,
		message: "Not Found",
	});
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	// general
	const dev = req.app.get("env") === "development";
	const errStatus = err.status || statusCodes.INTERNAL_SERVER_ERROR;
	const errMessage = dev
		? err.message || err
		: "An unexpected error has occurred, please try again later";

	res.status(errStatus).json({
		error: true,
		message: errMessage,
	});
});

async function start() {
	// clear clips
	await fs.remove(path.join(__dirname, "../clips"));

	// create clip folders
	await fs.ensureDir(path.join(__dirname, "../clips/downloaded"));
	await fs.ensureDir(path.join(__dirname, "../clips/merged"));

	// connect to MongoDB
	await db.connect();
	console.log("Connected to MongoDB");

	// connect to S3
	await s3.connect();
	console.log("Connected to S3");

	// start the server
	app
		.listen(port, () => {
			console.log(`App started on port ${port} (${env})`);
		})
		.on("error", (e) => {
			console.log(`Fatal error: ${e.message}`);
		});
}

start();
