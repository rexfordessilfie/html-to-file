import * as express from "express";
import * as path from "path";

import { DUMP_DIRECTORY } from "../util/constants";
import {
  deleteFileAfterTimeout,
  handleSendFileCallback,
} from "../util/helpers";

const router = express.Router();

router.get("/resource/:name", (req, res) => {
  const name = req.params.name as string;
  const filePath = path.resolve(DUMP_DIRECTORY, name);
  try {
    res.sendFile(filePath, (error) => {
      handleSendFileCallback(req, res, error, "resource");
    });
    // Delete file after sending to client
    deleteFileAfterTimeout(filePath, 1000);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.get("/download/:name", (req, res) => {
  const name = req.params.name as string;
  const filePath = path.resolve(DUMP_DIRECTORY, name);
  try {
    res.download(filePath, (error) => {
      handleSendFileCallback(req, res, error, "download");
    });
    // Delete file after sending to client
    deleteFileAfterTimeout(filePath, 1000);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

export { router };
