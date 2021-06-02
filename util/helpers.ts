import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import { decrypt, encryptAndSerialize } from "./crypto";
import { PuppeteerGeneratorSingleton } from "./generators";
import { Request, Response } from "express";
import {
  GenerateEndpointQueryParams,
  GeneratorImageOptions,
  GeneratorParams,
  HtmlToFileGenerator,
} from "./types";

export const deleteFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    console.log("[Utils] Deleting file...", { filePath });
    fs.unlinkSync(filePath);
  }
};

export const deleteFileAfterTimeout = (filePath: string, timeout: number) => {
  setTimeout(() => {
    deleteFile(filePath);
  }, timeout);
};

export const ensureDirectoryExists = (dirName: string) => {
  if (!fs.existsSync(dirName)) {
    console.log("[Utils] Directory does not exist. Creating...", { dirName });
    fs.mkdirSync(dirName);
  }
};

export const parseUrl = (url: string) => {
  console.log("[Utils] Parsing url...", { url });
  const urlData = new URL(url);
  return { host: urlData.host, url };
};

export const generateFilename = (
  params: GenerateEndpointQueryParams
): string => {
  const { url, selector, height, width, type, autoRegenerate } = params;
  const finalParams = removeEmptyValues({
    url,
    selector,
    height,
    width,
    type,
    autoRegenerate,
  });

  console.log({ finalParams });
  const encryptedSerializedParams = encryptAndSerialize(
    JSON.stringify(finalParams)
  );
  const filename = `htf_${encryptedSerializedParams}`;
  extractParamsFromFilename(filename);
  console.log("[Utils] Generated name for new file...", { filename });
  return filename;
};

export const extractParamsFromFilename = (
  filename: string
): GenerateEndpointQueryParams => {
  if (!filename.startsWith("htf")) {
    return {} as GeneratorParams;
  }

  const [, hashIv, hashContent] = filename.split("_");
  const decryptedSerializedParams = decrypt({
    iv: hashIv,
    content: hashContent,
  });

  const generatorParams = JSON.parse(decryptedSerializedParams);
  return generatorParams;
};

export const generateFile = async (
  fileGenerator: HtmlToFileGenerator,
  params: any,
  fileDestinationDir: string
) => {
  const { type = "image", url } = params as GeneratorParams;

  const extensions = {
    image: "png",
    pdf: "pdf",
  };

  const rawFilename = generateFilename(params);
  const filename = ensureFileExtension(rawFilename, extensions[type]);
  const absoluteFilePath = path.join(fileDestinationDir, filename);

  if (type === "image") {
    const imageOptions = extractImageOptions(params);
    await fileGenerator.generateImage(url, absoluteFilePath, imageOptions);
  } else if (type === "pdf") {
    await fileGenerator.generatePdf(url, absoluteFilePath);
  } else {
    throw new Error("Unrecognized file type");
  }

  return { filename, absoluteFilePath };
};

export const handleSendFileCallback = async (
  req: Request,
  res: Response,
  error: Error,
  responseKind: "resource" | "download"
) => {
  if (!error) {
    return;
  }

  console.log("[Helper - handleSendFileCallback] Error:", error);

  const { fallbackUrl } = req.query;
  const { name: filename } = req.params;

  try {
    const generatorParams = extractParamsFromFilename(filename);

    if (
      generatorParams.autoRegenerate &&
      !unwrapTextBoolean(generatorParams.autoRegenerate)
    ) {
      // File creator explicitly asked to not regenerate file so abort early
      throw new Error("Missing resource");
    }

    if (generatorParams.url) {
      const generateEndpointQueryParams: GenerateEndpointQueryParams = {
        ...generatorParams,
        responseKind,
        fallbackUrl: fallbackUrl as string,
      };

      const queryString = buildQueryString({
        ...generateEndpointQueryParams,
      });

      const generateEndpoint = appendQueryString("/generate", queryString);
      res.redirect(generateEndpoint);
    }
  } catch (error) {
    // Catch-all should render resource not found page
    res.render("templates/resource-not-found", { fallbackUrl });
  }
};

// https://stackoverflow.com/questions/37764665/typescript-sleep
export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/** Makes sure that the desired file extension is at the end of the given file name. Appends it if missing */
export const ensureFileExtension = (filename: string, ext: string) => {
  const extensionRegex = new RegExp(`${ext}\$`);
  if (!extensionRegex.test(filename)) {
    return `${filename}.${ext}`;
  }
  return filename;
};

export const buildQueryString = (queryParams: Record<string, any> = {}) => {
  const paramPairs = Object.keys(queryParams).map((key) => {
    if (!queryParams[key]) {
      return;
    }
    return `${key}=${queryParams[key]}`;
  });

  const queryString = paramPairs
    .filter((pair) => {
      return !!pair;
    })
    .join("&");
  return queryString;
};

export const appendQueryString = (url: string, queryString: string) => {
  if (!queryString) {
    return url;
  }

  if (!url.includes("?")) {
    return url + "?" + queryString;
  }

  return url + "&" + queryString;
};

export const removeEmptyValues = (obj: Object) => {
  return _(obj).omitBy(_.isNull).omitBy(_.isUndefined).value();
};

export const getFileGenerator = (): HtmlToFileGenerator => {
  return new PuppeteerGeneratorSingleton();
};

export const extractImageOptions = (obj: any) => {
  const { selector, width, height } = obj;
  return { selector, width, height } as GeneratorImageOptions;
};

export const unwrapTextBoolean = (text: string) => {
  const _text = text.toLowerCase();
  return _text === "true";
};

export const wrapTextBoolean = (bool: boolean) => {
  return bool ? "true" : "false";
};
