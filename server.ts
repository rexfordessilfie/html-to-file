import * as express from "express";
import * as path from "path";

import {
  deleteFileAfterTimeout,
  ensureDirectoryExists,
  generateFileNameFromUrl,
} from "./util/helpers";
import {
  extractImageOptions,
  HtmlToFileGenerator,
  PuppeteerGenerator,
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

app.use("/template/:name", (req, res) => {
  const name = req.params.name as string;
  const data = { ...req.body, baseUrl: PUBLIC_URL };
  res.render(`templates/${name}`, data);
});

app.use("/generate", checkValidUrl, async (req, res) => {
  try {
    const { url, type = "image" } = req.query;

    ensureDirectoryExists(DUMP_DIRECTORY);

    // Generate file name
    const fileName = generateFileNameFromUrl(url as string);
    const fileLocation = DUMP_DIRECTORY;
    let fileGenerator: HtmlToFileGenerator = new PuppeteerGenerator(
      url as string,
      fileName,
      fileLocation
    );

    let generatedFileName;
    if ((type as string) === "image") {
      const imageOptions = extractImageOptions(req.query);
      generatedFileName = await fileGenerator.generateImage(imageOptions);
    } else if ((type as string) === "pdf") {
      generatedFileName = await fileGenerator.generatePdf();
    } else {
      throw "Unrecognized file type";
    }

    const generatedFilePath = `${fileLocation}/${generatedFileName}`;
    deleteFileAfterTimeout(generatedFilePath, 30000); // delete file after 30 seconds
    res.send({
      success: true,
      message: "File successfully generated!",
      resourceLink: `${PUBLIC_URL}/resource/${generatedFileName}`,
      downloadLink: `${PUBLIC_URL}/download/${generatedFileName}`,
    });
  } catch (error) {
    res
      .status(400)
      .send({ success: false, message: "An error occurred: " + error });
  }
});

app.get("/resource/:name", (req, res) => {
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

app.get("/download/:name", (req, res) => {
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
