import * as express from "express";
import * as cors from "cors";

import { appRoutes } from "./routes";

const app = express();
app.set("view engine", "ejs");

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => {
  try {
    res.send({
      message: "Up and running!",
      success: true,
    });
  } catch (error) {
    res.status(400).send({ error: "Currently unavailable" });
  }
});

app.use(appRoutes);

export { app };
