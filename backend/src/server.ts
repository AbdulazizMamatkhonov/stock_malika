import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config();

const app = createApp();
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
