import { MongoClient, Collection, Db } from "mongodb";

class Database {
	client: MongoClient;
	db: Db;

	connect = async () => {
		this.client = new MongoClient(process.env.DB_URI);

		await this.client.connect();
	};
}

const db = new Database();

export default db;
