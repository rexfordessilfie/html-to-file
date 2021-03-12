import * as puppeteer from "puppeteer";
import { ensureFileExtension } from "./helpers";

interface ImageOptions {
  selector?: string;
  height?: number;
  width?: number;
}

interface PdfOptions {}

export const extractImageOptions = (obj: any) => {
  const { selector, width, height } = obj;
  return { selector, width, height } as ImageOptions;
};

export interface HtmlToFileGenerator {
  generateImage(options?: any): string | Promise<string>;
  generatePdf(options?: any): string | Promise<string>;
}

export interface HtmlToFileGeneratorSingleton {
  generateImage(
    url: string,
    destination: string,
    options?: ImageOptions
  ): Promise<string>;
  generatePdf(
    url: string,
    destination: string,
    options?: PdfOptions
  ): Promise<string>;
}

export class PuppeteerGenerator implements HtmlToFileGenerator {
  page = {} as puppeteer.Page;
  browser = {} as puppeteer.Browser;
  url = "";
  fileName = "";
  fileLocation = "";

  constructor(url: string, fileName: string, fileLocation: string) {
    this.url = url;
    this.fileName = fileName;
    this.fileLocation = fileLocation;
  }

  async setUp() {
    this.browser = await puppeteer.launch({
      // should allow puppeteer to work in heroku
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    this.page = await this.browser.newPage();
    // Make sure content has finished loading on page
    await this.page.goto(this.url, { waitUntil: "networkidle0" });
  }

  async tearDown() {
    this.browser.close();
  }

  async generateImage(options: any): Promise<string> {
    console.log("[PuppeteerGenerator] About to generate image...");
    try {
      const fileNamePlusExtension = `${this.fileName}.png`;
      await this.setUp();
      const processedOptions = await this.processImageOptions(options);
      const { target, ...screenshotOptions } = processedOptions;
      await target?.screenshot({
        path: `${this.fileLocation}/${fileNamePlusExtension}`,
        ...screenshotOptions,
      });
      await this.tearDown();
      console.log("[PuppeteerGenerator] Done generating image");
      return fileNamePlusExtension;
    } catch (error) {
      throw error;
    }
  }

  async generatePdf(options: any): Promise<string> {
    console.log("[PuppeteerGenerator] About to generate pdf...");
    try {
      const fileNamePlusExtension = `${this.fileName}.pdf`;
      await this.setUp();
      await this.page.pdf({
        path: `${this.fileLocation}/${fileNamePlusExtension}`,
        ...options,
      });
      await this.tearDown();
      console.log("[PuppeteerGenerator] Done generating pdf.");
      return fileNamePlusExtension;
    } catch (error) {
      throw error;
    }
  }

  // Page must already be active before handling options
  async processImageOptions(options: ImageOptions): Promise<any> {
    console.log("[PuppeteerGenerator] Processing image options...");
    const { selector, width, height } = options;
    let processedOptions = {};

    const target = selector ? await this.page.$(selector) : this.page;
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
    const newViewport = await this.page.$eval("body", (bodyHandle) => {
      const boundingBox = bodyHandle.getBoundingClientRect();
      return {
        width: Math.ceil(boundingBox.width),
        height: Math.ceil(boundingBox.height),
      };
    });
    await this.page.setViewport(newViewport);
  }
}

export class PuppeteerGeneratorSingleton
  implements HtmlToFileGeneratorSingleton {
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

  async closeBrowserPage() {
    if (this.page) {
      await this.page.close();
    }
  }

  async generateImage(
    url: string,
    filename: string,
    options: any
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
      // await this.closeBrowserPage()
      return fileWithExtension;
    } catch (error) {
      throw error;
    }
  }

  async generatePdf(
    url: string,
    filename: string,
    options: any
  ): Promise<string> {
    console.log("[PuppeteerGenerator] About to generate pdf...");
    const fileWithExtension = ensureFileExtension(filename, "pdf");
    try {
      await this.loadBrowserPage(url);
      await this.page?.pdf({
        path: ensureFileExtension(filename, ".pdf"),
        ...options,
      });
      console.log("[PuppeteerGenerator] Done generating pdf."),
        { fileWithExtension };
      // await this.closeBrowserPage()
      return fileWithExtension;
    } catch (error) {
      throw error;
    }
  }

  // Page must already be active before handling options
  async processImageOptions(options: ImageOptions): Promise<any> {
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
