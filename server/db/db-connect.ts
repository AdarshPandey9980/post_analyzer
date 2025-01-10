import { Collection, DataAPIClient } from "@datastax/astra-db-ts";
import dotenv from "dotenv";

dotenv.config();

export let collection: Collection;

const dbConnect = async () => {
  console.log(process.env.ASTRA_TOKEN,"    ", process.env.ASTRA_TOKEN );
  
  const client = new DataAPIClient(process.env.ASTRA_TOKEN);

  const db = client.db(process.env.ASTRA_URL, {
    keyspace: "default_keyspace",
    token: process.env.ASTRA_TOKEN,
  });

  collection = db.collection("posts_data");

  console.log(collection);
  

  console.log("Astra db is connected");
};

export default dbConnect;
