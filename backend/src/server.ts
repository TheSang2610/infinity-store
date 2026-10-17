import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Infinity Store API chạy tại http://localhost:${env.port}`);
});
