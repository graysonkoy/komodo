import { MongoClient, Db } from "mongodb";

class Database {
	client: MongoClient;
	db: Db;

	connect = async () => {
		this.client = new MongoClient(process.env.DB_URI);

		await this.client.connect();

		this.db = this.client.db(process.env.DB_TABLE);
	};

	storeClipData = async (slug: string, data: Object) => {
		const collection = this.db.collection("clips");

		await collection.insertOne({
			_id: slug as any,
			data,
		});
	};

	getClipData = async (slug: string) => {
		const collection = this.db.collection("clips");
		const data = await collection
			.find({
				_id: slug,
			})
			.toArray();

		if (data.length == 0) return null;
		else return data[0].data;
	};
}

const db = new Database();

export default db;
