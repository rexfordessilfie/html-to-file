import * as fs from "fs";

export const deleteFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    console.log("[Utils] Deleting file...", { filePath });
    fs.unlink(filePath, (error) => {
      if (error) {
        console.log("File could not be deleted", error);
      }
    });
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
  const validUrlPattern = /^(http|https):\/\/www\..*\..*/;
  if (!validUrlPattern.test(url)) {
    throw new Error(
      "Invalid url. Expected url to match http(s)://www.domain.com"
    );
  }

  const domain = url.split(".")[1] as string;
  const urlData = new URL(url);
  return { host: urlData.host, domain };
};

export const generateFileNameFromUrl = (url: string): string => {
  const { host } = parseUrl(url);
  const fileName = `${host}${Date.now()}`;
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
  const splitFile = filename.split(".");
  const currentExt = splitFile[splitFile.length - 1];
  if (currentExt != ext) {
    return `${filename}.${ext}`;
  }
  return filename;
};
