import * as express from "express";
import * as puppeteer from "puppeteer";
import * as path from "path";
import * as fs from "fs";

const app = express();
const port = process.env.PORT || 4000;

app.set("view engine", "ejs");

const parseUrl: any = (url: string) => {
  const validUrlPattern = /^(http|https):\/\/www\..*\..*/;
  if (!validUrlPattern.test(url)) {
    throw new Error("Invalid url. Expected http(s)://www.domain.com");
  }

  const domain = url.split(".")[1] as string;
  const urlData = new URL(url);
  const host = urlData.host;
  return { host, domain };
};

const deleteFile: any = (path: string, timeout: number) => {
  console.log("Deleting file", path);
  setTimeout(() => {
    if (fs.existsSync(path)) {
      fs.unlink(path, (error) => {
        if (error) {
          console.log("File could not be deleted", error);
        }
      });
    }
  }, timeout);
};

app.use("/template/:name", (req, res) => {
  const name = req.params.name as string;
  res.render(`templates/${name}`, req.body);
});

app.use("/generate", async (req, res) => {
  try {
    const url = req.query.url as string;
    const type = (req.query.type as string) || "image";

    if (!url) {
      res.status(403).json({ success: false, message: "invalid url" });
      return;
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    switch (type) {
      case "image": {
        const { host } = parseUrl(url);
        const fileName = `${host}${Date.now()}.png`;
        const filePath = `./temp/${fileName}`;
        await page.screenshot({
          path: filePath,
        });

        const baseUrl =
          process.env.NODE_ENV === "development"
            ? `http://localhost:${port}`
            : process.env.BASE_URL;
        res.send({
          success: true,
          message:
            "Your resource was generated and will be deleted after you access it or after 30 seconds.",
          resourceLink: `${baseUrl}/resource/${fileName}`,
        });
        // Delete file after 30 seconds
        deleteFile(filePath, 30000);
        break;
      }

      default: {
        throw Error("Unrecognized type");
      }
    }
  } catch (error) {
    res
      .status(400)
      .send({ success: false, message: "An error occurred: " + error });
  }
});

app.get("/resource/:name", (req, res) => {
  const name = req.params.name;
  const filePath = path.resolve(__dirname, "temp", name);
  try {
    res.sendFile(filePath);
    // Delete file after sending to client
    deleteFile(filePath, 1000);
  } catch (error) {
    res.status(400).send({ error: "File no longer exists" });
  }
});

try {
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}!`);
  });
} catch (error) {
  console.log(error);
}
