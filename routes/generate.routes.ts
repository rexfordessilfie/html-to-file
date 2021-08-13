import * as express from "express";
import * as fs from "fs";

import {
  DEFAULT_GENERATE_ENDPOINT_QUERY,
  DUMP_DIRECTORY,
  PUBLIC_URL,
} from "../util/constants";

import {
  appendQueryString,
  buildQueryString,
  deleteFileAfterTimeout,
  ensureDirectoryExists,
  generateFile,
  getFileGenerator,
} from "../util/helpers";
import { GenerateEndpointQueryParams } from "../util/types";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const reqQuery = {
      ...DEFAULT_GENERATE_ENDPOINT_QUERY,
      ...req.query,
    };

    const { responseKind = "json" } = reqQuery;

    ensureDirectoryExists(DUMP_DIRECTORY);

    const fileGenerator = getFileGenerator();
    const { filename, absoluteFilePath } = await generateFile(
      fileGenerator,
      reqQuery as GenerateEndpointQueryParams,
      DUMP_DIRECTORY
    );

    deleteFileAfterTimeout(absoluteFilePath, 30000); // delete file after 30 seconds

    const internalResourcePath = `/file/resource/${filename}`;
    const internalDownloadPath = `/file/download/${filename}`;

    if (responseKind === "resource") {
      res.redirect(internalResourcePath);
    } else if (responseKind === "download") {
      res.redirect(internalDownloadPath);
    } else if (responseKind === "buffer") {
      const buffer = fs.readFileSync(absoluteFilePath);
      res.send({ buffer });
    } else {
      // Respond with JSON object
      const { fallbackUrl } = reqQuery;
      const finalQueryString = buildQueryString({ fallbackUrl });
      const _resourceLink = `${PUBLIC_URL}${internalResourcePath}`;
      const _downloadLink = `${PUBLIC_URL}${internalDownloadPath}`;

      const resourceLink = appendQueryString(_resourceLink, finalQueryString);
      const downloadLink = appendQueryString(_downloadLink, finalQueryString);

      res.send({
        success: true,
        message: "File successfully generated!",
        resourceLink,
        downloadLink,
      });
    }
  } catch (error) {
    res
      .status(400)
      .send({ success: false, message: "An error occurred: " + error });
  }
});

export { router };
