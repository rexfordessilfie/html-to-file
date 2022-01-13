import * as express from "express";
import { PUBLIC_URL } from "../util/constants";

const router = express.Router();

router.get("/:name", (req, res) => {
  const templateName = req.params.name as string;
  const { fallbackUrl = "" } = req.query;
  const data = { fallbackUrl, baseUrl: PUBLIC_URL };
  res.render(`${templateName}`, data);
});

export { router };
