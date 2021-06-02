import * as express from "express";
import * as path from "path";
import * as cors from "cors";

import {
  deleteFileAfterTimeout,
  ensureDirectoryExists,
  generateFile,
  getFileGenerator,
  handleSendFileCallback,
  unwrapTextBoolean,
} from "./util/helpers";

import { checkValidUrl } from "./middleware";
import { GenerateEndpointQueryParams } from "./util/types";

const PORT = process.env.PORT || 4000;
const DUMP_DIRECTORY = path.resolve("./temp");
const PUBLIC_URL =
  process.env.NODE_ENV === "production"
    ? process.env.PUBLIC_URL
    : `http://localhost:${PORT}`;

const DEFAULT_GENERATE_ENDPOINT_QUERY: Partial<GenerateEndpointQueryParams> = {
  respondWithResource: "false",
  respondWithDownload: "false",
  autoRegenerate: "true",
  fallbackUrl: "",
};

const app = express();
app.set("view engine", "ejs");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/template/:name", (req, res) => {
  const templateName = req.params.name as string;
  const { fallbackUrl = "" } = req.query;
  const data = { fallbackUrl, baseUrl: PUBLIC_URL };
  res.render(`templates/${templateName}`, data);
});

app.get("/generate", checkValidUrl, async (req, res) => {
  try {
    const reqQuery = {
      ...DEFAULT_GENERATE_ENDPOINT_QUERY,
      ...req.query,
    };

    const { respondWithResource = "false", respondWithDownload = "false" } =
      reqQuery;

    ensureDirectoryExists(DUMP_DIRECTORY);

    const fileGenerator = getFileGenerator();
    const { filename, absoluteFilePath } = await generateFile(
      fileGenerator,
      reqQuery,
      DUMP_DIRECTORY
    );

    deleteFileAfterTimeout(absoluteFilePath, 30000); // delete file after 30 seconds

    const internalResourcePath = `/resources/${filename}`;
    const internalDownloadPath = `/downloads/${filename}`;

    if (unwrapTextBoolean(respondWithResource as string)) {
      res.redirect(internalResourcePath);
    } else if (unwrapTextBoolean(respondWithDownload as string)) {
      res.redirect(internalDownloadPath);
    } else {
      // Respond with JSON object
      const resourceLink = `${PUBLIC_URL}${internalResourcePath}`;
      const downloadLink = `${PUBLIC_URL}${internalDownloadPath}`;

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

app.get("/resources/:name", (req, res) => {
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

app.get("/downloads/:name", (req, res) => {
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

try {
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}!`);
  });
} catch (error) {
  console.log(error);
}
