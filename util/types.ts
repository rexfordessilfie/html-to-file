export interface GeneratorImageOptions {
  selector?: string;
  height?: number;
  width?: number;
}

export interface GeneratorPdfOptions {}

export interface HtmlToFileGenerator {
  generateImage(
    url: string,
    destination: string,
    options?: GeneratorImageOptions
  ): Promise<string>;

  generatePdf(
    url: string,
    destination: string,
    options?: GeneratorPdfOptions
  ): Promise<string>;
}

export type GeneratorParams = {
  url: string;
  type: "image" | "pdf";
  selector: string;
  height?: number;
  width?: number;
};

export interface GenerateEndpointQueryParams extends GeneratorParams {
  respondWithResource?: boolean;
  respondWithDownload?: boolean;
  fallbackUrl?: string;
}
