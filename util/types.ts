export interface GeneratorImageOptions {
  selector?: string;
  height?: number;
  width?: number;
}

export interface GeneratorPdfOptions {}

export interface HtmlToFileGenerator {
  generateImage(
    source: string,
    sourceKind: HtmlSourceKind,
    destination: string,
    options?: GeneratorImageOptions
  ): Promise<string>;

  generatePdf(
    source: string,
    destination: string,
    options?: GeneratorPdfOptions
  ): Promise<string>;
}

export type GeneratorParams = {
  url?: string;
  html?: string;
  type: "image" | "pdf";
  selector: string;
  height?: number;
  width?: number;
};

export type ResponseKind = "resource" | "download" | "json" | "buffer";

export interface GenerateEndpointQueryParams extends GeneratorParams {
  responseKind?: ResponseKind;
  autoRegenerate?: string;
  fallbackUrl?: string;
}

export type HtmlSourceKind = "url" | "html";
