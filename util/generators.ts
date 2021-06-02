import * as puppeteer from "puppeteer";
import { ensureFileExtension, removeEmptyValues } from "./helpers";
import { HtmlToFileGenerator, GeneratorImageOptions } from "./types";
import * as crypto from "crypto";

export class PuppeteerGeneratorSingleton implements HtmlToFileGenerator {
  static browser: puppeteer.Browser | null;
  static _instance: PuppeteerGeneratorSingleton;

  static pages = {} as Record<string, puppeteer.Page | null | undefined>;

  constructor() {
    if (!PuppeteerGeneratorSingleton.browser) {
      PuppeteerGeneratorSingleton.setUp();
      PuppeteerGeneratorSingleton._instance = this;
    }
    return PuppeteerGeneratorSingleton._instance;
  }

  static async setUp() {
    PuppeteerGeneratorSingleton.browser = await puppeteer.launch({
      // should allow puppeteer to work in heroku
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  static async tearDown() {
    if (PuppeteerGeneratorSingleton.browser) {
      await PuppeteerGeneratorSingleton.browser.close();
    }
    PuppeteerGeneratorSingleton.browser = null;
  }

  static generatePageId() {
    return crypto.randomBytes(32).toString("hex");
  }

  static getPageById(pageId: string) {
    return PuppeteerGeneratorSingleton.pages[pageId];
  }

  static async loadBrowserPage(url: string) {
    const pageId = PuppeteerGeneratorSingleton.generatePageId();
    PuppeteerGeneratorSingleton.pages[pageId] = null;

    try {
      const page = await PuppeteerGeneratorSingleton.browser?.newPage();
      await page?.goto(url, { waitUntil: "networkidle0" }); // Make sure content has finished loading on page
      PuppeteerGeneratorSingleton.pages[pageId] = page;
    } catch (error) {
      console.log(error);
    }

    return pageId;
  }

  /** Closes the browser page. (currently not in use since closing sometimes causes navigation errors) */
  static async closeBrowserPage(pageId: string) {
    const pageToClose = PuppeteerGeneratorSingleton.pages[pageId];
    if (pageToClose) {
      await pageToClose.close();
      PuppeteerGeneratorSingleton.pages[pageId] = null;
      console.log(`[PuppeteerGenerator] Closing browser page`, {
        pageId,
      });
    }
  }

  async generateImage(
    url: string,
    filename: string,
    options: any = {}
  ): Promise<string> {
    console.log("[PuppeteerGenerator] About to generate image...");
    const fileWithExtension = ensureFileExtension(filename, "png");
    try {
      const pageId = await PuppeteerGeneratorSingleton.loadBrowserPage(url);
      const processedOptions = await this.processImageOptions(options, pageId);
      const { target, ...screenshotOptions } = processedOptions;
      await target?.screenshot({
        path: fileWithExtension,
        ...screenshotOptions,
      });
      console.log("[PuppeteerGenerator] Done generating image", {
        fileWithExtension,
      });
      await PuppeteerGeneratorSingleton.closeBrowserPage(pageId);
      return fileWithExtension;
    } catch (error) {
      throw error;
    }
  }

  async generatePdf(
    url: string,
    filename: string,
    options: any = {}
  ): Promise<string> {
    console.log("[PuppeteerGenerator] About to generate pdf...");
    const fileWithExtension = ensureFileExtension(filename, "pdf");
    try {
      const pageId = await PuppeteerGeneratorSingleton.loadBrowserPage(url);
      const page = PuppeteerGeneratorSingleton.getPageById(pageId);
      await page?.pdf({
        path: fileWithExtension,
        ...options,
      });
      console.log("[PuppeteerGenerator] Done generating pdf."),
        { fileWithExtension };
      return fileWithExtension;
    } catch (error) {
      throw error;
    }
  }

  // Page must already be active before handling options
  async processImageOptions(
    options: GeneratorImageOptions,
    pageId: string
  ): Promise<any> {
    console.log("[PuppeteerGenerator] Processing image options...");
    const { selector, width, height } = options;
    let processedOptions = {};

    const page = PuppeteerGeneratorSingleton.getPageById(pageId);

    if (!page) {
      return {};
    }

    const target = selector ? await page?.$(selector) : page;
    processedOptions = { ...processedOptions, target };

    if (width) {
      processedOptions = { ...processedOptions, width };
    }
    if (height) {
      processedOptions = { ...processedOptions, height };
    }
    return processedOptions;
  }

  // https://petertran.com.au/2018/07/12/blank-images-puppeteer-screenshots-solved/
  // Resize the viewport to screenshot elements outside of the viewport
  async resizePage(pageId: string) {
    const page = PuppeteerGeneratorSingleton.getPageById(pageId);
    const newViewport = (await page?.$eval("body", (bodyHandle) => {
      const boundingBox = bodyHandle.getBoundingClientRect();
      return {
        width: Math.ceil(boundingBox.width),
        height: Math.ceil(boundingBox.height),
      };
    })) as puppeteer.Viewport;
    await page?.setViewport(newViewport);
  }
}
