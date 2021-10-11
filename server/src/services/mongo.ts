import { MongoClient, Collection, Db, ObjectId } from "mongodb";

class Database {
	client: MongoClient;
	db: Db;

	connect = async () => {
		this.client = new MongoClient(process.env.DB_URI);

		await this.client.connect();

		this.db = this.client.db(process.env.DB_TABLE);
	};

	addClip = async (slug: string, data: Object) => {
		const collection = this.db.collection("clips");
		await collection.insertOne({
			slug,
			data,
		});
	};
}

const db = new Database();

export default db;
