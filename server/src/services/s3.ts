import AWS from "aws-sdk";
import fs from "fs-extra";

class S3 {
	s3: AWS.S3;

	connect = async () => {
		// Connect to S3
		this.s3 = await new AWS.S3({ apiVersion: "2006-03-01" });

		// Create S3 bucket
		await this.s3
			.createBucket({
				Bucket: process.env.S3_BUCKET_NAME,
			})
			.promise()
			.catch((e) => console.log(e));
	};

	storeVideo = async (slug, filename) => {
		const video = await fs.readFile(filename);

		await this.s3
			.upload({
				Bucket: process.env.S3_BUCKET_NAME,
				Key: slug,
				Body: video,
			})
			.promise();
	};

	uploadStream = async (slug, stream) => {
		await this.s3
			.upload(
				{
					Bucket: process.env.S3_BUCKET_NAME,
					Key: slug,
					Body: stream,
				},
				{
					partSize: 1024 * 1024 * 64, // 64 MB in bytes
				}
			)
			.promise();
	};

	getVideo = async (slug) => {
		try {
			const result = await this.s3
				.getObject({
					Bucket: process.env.S3_BUCKET_NAME,
					Key: slug,
				})
				.promise();

			return result.Body;
		} catch (e) {
			return null;
		}
	};
}

const s3 = new S3();

export default s3;
