import crypto from "crypto";

export default function randomString(length = 12) {
	const bytes = crypto.randomBytes(length);
	return bytes.toString("hex");
}
