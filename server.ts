import * as express from "express";
import * as path from "path";
import * as cors from "cors";

import {
  deleteFileAfterTimeout,
  ensureDirectoryExists,
  ensureFileExtension,
  generateFileNameFromUrl,
} from "./util/helpers";
import {
  extractImageOptions,
  HtmlToFileGenerator,
  HtmlToFileGeneratorSingleton,
  PuppeteerGeneratorSingleton,
} from "./util/generators";
import { checkValidUrl } from "./middleware";

const PORT = process.env.PORT || 4000;
const DUMP_DIRECTORY = path.resolve("./temp");
const PUBLIC_URL =
  process.env.NODE_ENV === "production"
    ? process.env.PUBLIC_URL
    : `http://localhost:${PORT}`;

const app = express();
app.set("view engine", "ejs");
app.use(cors({ origin: true, credentials: true }));

app.use("/template/:name", (req, res) => {
  const name = req.params.name as string;
  const data = { ...req.body, baseUrl: PUBLIC_URL };
  res.render(`templates/${name}`, data);
});

app.use("/generate", checkValidUrl, async (req, res) => {
  try {
    const {
      url,
      type = "image",
      respondWithResource = false,
      respondWithDownload = false,
    } = req.query;

    ensureDirectoryExists(DUMP_DIRECTORY);

    // Generate file name
    let fileGenerator:
      | HtmlToFileGeneratorSingleton
      | HtmlToFileGenerator = new PuppeteerGeneratorSingleton();
    const filename = generateFileNameFromUrl(url as string);

    let filePathNoExtension = path.join(DUMP_DIRECTORY, filename);
    let finalFilePath;

    if ((type as string) === "image") {
      const imageOptions = extractImageOptions(req.query);
      finalFilePath = ensureFileExtension(filePathNoExtension, "png");
      await fileGenerator.generateImage(
        url as string,
        finalFilePath,
        imageOptions
      );
    } else if ((type as string) === "pdf") {
      finalFilePath = ensureFileExtension(filePathNoExtension, "pdf");
      await fileGenerator.generatePdf(url as string, finalFilePath);
    } else {
      throw "Unrecognized file type";
    }

    deleteFileAfterTimeout(finalFilePath, 30000); // delete file after 30 seconds

    const splitFinalPath = finalFilePath.split("/");
    const resourceName = splitFinalPath[splitFinalPath.length - 1];
    const internalResourcePath = `/resources/${resourceName}`;
    const internalDownloadPath = `/downloads/${resourceName}`;

    if (respondWithResource) {
      res.redirect(internalResourcePath);
    } else if (respondWithDownload) {
      res.redirect(internalDownloadPath);
    } else {
      res.send({
        success: true,
        message: "File successfully generated!",
        resourceLink: `${PUBLIC_URL}${internalResourcePath}`,
        downloadLink: `${PUBLIC_URL}${internalDownloadPath}`,
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
    res.sendFile(filePath);
    // Delete file after sending to client
    deleteFileAfterTimeout(filePath, 1000);
  } catch (error) {
    res.status(400).send({ error: "File no longer exists" });
  }
});

app.get("/downloads/:name", (req, res) => {
  const name = req.params.name as string;
  const filePath = path.resolve(DUMP_DIRECTORY, name);
  try {
    res.download(filePath);
    // Delete file after sending to client
    deleteFileAfterTimeout(filePath, 1000);
  } catch (error) {
    res.status(400).send({ error: "File no longer exists" });
  }
});

try {
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}!`);
  });
} catch (error) {
  console.log(error);
}
