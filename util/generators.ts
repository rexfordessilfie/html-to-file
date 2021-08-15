import * as puppeteer from "puppeteer";
import { ensureFileExtension } from "./helpers";
import {
  HtmlToFileGenerator,
  GeneratorImageOptions,
  HtmlSourceKind,
} from "./types";
import * as crypto from "crypto";

export class PuppeteerGeneratorSingleton implements HtmlToFileGenerator {
  static browser: puppeteer.Browser | null;
  static _instance: PuppeteerGeneratorSingleton;

  static pages = {} as Record<string, puppeteer.Page | null | undefined>;

  constructor() {
    if (!PuppeteerGeneratorSingleton._instance) {
      PuppeteerGeneratorSingleton._instance = this;
    }
    return PuppeteerGeneratorSingleton._instance;
  }

  static async setUpBrowser() {
    // TODO: manage multiple browsers
    if (PuppeteerGeneratorSingleton.browser) {
      return;
    }

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

  static async loadBrowserPage(source: string, sourceKind: HtmlSourceKind) {
    const pageId = PuppeteerGeneratorSingleton.generatePageId();
    PuppeteerGeneratorSingleton.pages[pageId] = null;

    try {
      await PuppeteerGeneratorSingleton.setUpBrowser();
      const page = await PuppeteerGeneratorSingleton.browser?.newPage();

      if (sourceKind == "url") {
        await page?.goto(source, { waitUntil: "networkidle0" }); // Make sure content has finished loading on page
      } else if (sourceKind == "html") {
        await page?.setContent(source);
      } else {
        throw new Error("Unrecognized source kind");
      }
      PuppeteerGeneratorSingleton.pages[pageId] = page;
    } catch (error) {
      console.log(error);
    }

    return pageId;
  }

  /** Closes the browser page. (currently not in use since closing sometimes causes navigation errors) */
  static async closeBrowserPage(pageId: string | null) {
    if (!pageId) {
      return;
    }

    const pageToClose = PuppeteerGeneratorSingleton.pages[pageId];

    if (pageToClose) {
      await pageToClose.close();
      PuppeteerGeneratorSingleton.pages[pageId] = null;
      console.log(`[PuppeteerGenerator] Closing browser page`, {
        pageId,
      });
    }

    await PuppeteerGeneratorSingleton.tearDownBrowserIfInactive();
  }

  static async tearDownBrowserIfInactive() {
    const openPages = Object.values(PuppeteerGeneratorSingleton.pages).filter(
      (page) => !!page
    );
    const allPagesClosed = openPages.length == 0;

    if (allPagesClosed) {
      PuppeteerGeneratorSingleton.tearDown();
    }
  }

  async generateImage(
    source: string,
    sourceKind: HtmlSourceKind,
    filename: string,
    options: any = {}
  ): Promise<string> {
    let pageId = null;
    console.log("[PuppeteerGenerator] About to generate image...");
    const fileWithExtension = ensureFileExtension(filename, "png");
    try {
      pageId = await PuppeteerGeneratorSingleton.loadBrowserPage(
        source,
        sourceKind
      );
      const processedOptions = await this.processImageOptions(options, pageId);
      const { target, ...screenshotOptions } = processedOptions;
      await target?.screenshot({
        path: fileWithExtension,
        ...screenshotOptions,
      });
      console.log("[PuppeteerGenerator] Done generating image", {
        fileWithExtension,
      });
      return fileWithExtension;
    } catch (error) {
      throw error;
    } finally {
      await PuppeteerGeneratorSingleton.closeBrowserPage(pageId);
    }
  }

  async generatePdf(
    source: string,
    sourceKind: HtmlSourceKind,
    filename: string,
    options: any = {}
  ): Promise<string> {
    let pageId = null;
    console.log("[PuppeteerGenerator] About to generate pdf...");
    const fileWithExtension = ensureFileExtension(filename, "pdf");
    try {
      pageId = await PuppeteerGeneratorSingleton.loadBrowserPage(
        source,
        sourceKind
      );
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
    } finally {
      await PuppeteerGeneratorSingleton.closeBrowserPage(pageId);
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
