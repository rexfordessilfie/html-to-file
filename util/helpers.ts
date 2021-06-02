import * as fs from "fs";

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

export const generateFilename = ({ url }: { url: string }): string => {
  const { host } = parseUrl(url);
  const fileName = `${host}-${Date.now()}`;
  console.log("[Utils] Generated name for new file...", { fileName });
  // NB: the file extension will be added by the generator
  return fileName;
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
