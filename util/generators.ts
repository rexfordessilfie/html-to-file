import * as puppeteer from "puppeteer";
import { ensureFileExtension } from "./helpers";
import { HtmlToFileGenerator, GeneratorImageOptions } from "./types";
export class PuppeteerGeneratorSingleton implements HtmlToFileGenerator {
  static browser: puppeteer.Browser | null;
  static _instance: PuppeteerGeneratorSingleton;

  page = {} as puppeteer.Page | undefined;

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

  async loadBrowserPage(url: string) {
    this.page = await PuppeteerGeneratorSingleton.browser?.newPage();
    await this.page?.goto(url, { waitUntil: "networkidle0" }); // Make sure content has finished loading on page
  }

  /** Closes the browser page. (currently not in use since closing sometimes causes navigation errors) */
  async closeBrowserPage() {
    if (this.page) {
      await this.page.close();
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
      await this.loadBrowserPage(url);
      const processedOptions = await this.processImageOptions(options);
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
      await this.loadBrowserPage(url);
      await this.page?.pdf({
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
  async processImageOptions(options: GeneratorImageOptions): Promise<any> {
    console.log("[PuppeteerGenerator] Processing image options...");
    const { selector, width, height } = options;
    let processedOptions = {};

    if (!this.page) {
      return {};
    }

    const target = selector ? await this.page?.$(selector) : this.page;
    processedOptions = { ...processedOptions, target };

    if (width) {
      processedOptions = { ...processedOptions, width };
    }
    if (height) {
      processedOptions = { ...processedOptions, height };
    }
    return processedOptions;
  }

  async resizePage() {
    // https://petertran.com.au/2018/07/12/blank-images-puppeteer-screenshots-solved/
    // Resize the viewport to screenshot elements outside of the viewport
    const newViewport = (await this.page?.$eval("body", (bodyHandle) => {
      const boundingBox = bodyHandle.getBoundingClientRect();
      return {
        width: Math.ceil(boundingBox.width),
        height: Math.ceil(boundingBox.height),
      };
    })) as puppeteer.Viewport;
    await this.page?.setViewport(newViewport);
  }
}
