import dotenv from "dotenv";
import { createApp } from "./app";
import { connectMongo } from "./lib/mongo";

dotenv.config();

const app = createApp();
const port = process.env.PORT || 4000;

connectMongo()
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
