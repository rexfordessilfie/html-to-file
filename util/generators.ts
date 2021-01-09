import * as puppeteer from "puppeteer";

export interface HtmlToFileGenerator {
  generateImage(options?: any): string | Promise<string>;
  generatePdf(options?: any): string | Promise<string>;
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
    await this.page.goto(this.url);
  }

  async tearDown() {
    await this.browser.close();
  }

  async generateImage(options: any): Promise<string> {
    console.log("[PuppeteerGenerator] About to generate image...");
    try {
      const fileNamePlusExtension = `${this.fileName}.png`;
      await this.setUp();
      await this.page.screenshot({
        path: `${this.fileLocation}/${fileNamePlusExtension}`,
        ...options,
      });
      await this.tearDown();
      console.log("[PuppeteerGenerator] Done generating image...");
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
      console.log("[PuppeteerGenerator] Done generating pdf...");
      return fileNamePlusExtension;
    } catch (error) {
      throw error;
    }
  }
}
