import * as fs from "fs";
import * as path from "path";
import {
  deleteFile,
  ensureDirectoryExists,
  ensureFileExtension,
  buildQueryString,
  appendQueryString,
  isValidUrl,
} from "../util/helpers";

describe("deleteFile", () => {
  const testDeleteFileName = path.resolve("./tests/test-delete-file.txt");
  const nonExistingFile = path.resolve(
    "./tests/test-non-existing-delete-file.txt"
  );

  it("should delete existing file", () => {
    fs.openSync(testDeleteFileName, "w");
    deleteFile(testDeleteFileName);
    expect(fs.existsSync(testDeleteFileName)).toBe(false);
  });

  it("should do nothing if non-existing file", () => {
    expect(deleteFile(nonExistingFile)).toBe(undefined);
  });
});

describe("ensureDirectoryExists", () => {
  const nonExistingDirectory = path.resolve("./tests/non-existing");

  it("should create directory if not existing", () => {
    try {
      fs.rmdirSync(nonExistingDirectory);
    } catch (error) {
      // fail silently
    }
    ensureDirectoryExists(nonExistingDirectory);
    expect(fs.existsSync(nonExistingDirectory)).toBe(true);
    fs.rmdirSync(nonExistingDirectory);
  });
});

describe("ensureFileExtension", () => {
  it("should append file extension if it does not exist", () => {
    const ext = "jpg";
    const filenameWithoutExt = "hello";
    const filename = ensureFileExtension(filenameWithoutExt, ext);
    expect(filename).toBe("hello.jpg");
  });

  it("should append file extension even if one exists already", () => {
    const ext = "jpg";
    const filenameWithoutExt = "hello.png";
    const filename = ensureFileExtension(filenameWithoutExt, ext);
    expect(filename).toBe("hello.png.jpg");
  });

  it("should not append file extension if the same extension is already present", () => {
    const ext = "jpg";
    const filenameWithoutExt = "hello.jpg";
    const filename = ensureFileExtension(filenameWithoutExt, ext);
    expect(filename).toBe("hello.jpg");
  });
});

describe("buildQueryString", () => {
  it("should build a valid query string from provided params", () => {
    const params = {
      name: "Somebody",
      color: "Blue",
    };

    const params2 = {
      age: 12,
    };

    const queryString = buildQueryString(params);
    const queryString2 = buildQueryString(params2);

    expect(queryString).toBe("name=Somebody&color=Blue");
    expect(queryString2).toBe("age=12");
  });

  it("should build an empty query string from empty params", () => {
    const queryString = buildQueryString({});
    expect(queryString).toBe("");
  });
});

describe("appendQueryString", () => {
  it("should append query string with ? when none existing in url", () => {
    const url = "https://www.blah.com";
    const queryString = "name=Somebody";

    const urlWithQueryString = appendQueryString(url, queryString);
    expect(urlWithQueryString).toBe(url + "?" + queryString);
  });

  it("should append query string without ? when query params already present in url", () => {
    const url = "https://www.blah.com?color=Blue";
    const queryString = "name=Somebody";

    const urlWithQueryString = appendQueryString(url, queryString);
    expect(urlWithQueryString).toBe(url + "&" + queryString);
  });

  it("should return original url if no query string provided", () => {
    const url = "https://www.blah.com?color=Blue";

    const finalUrl = appendQueryString(url, "");
    expect(finalUrl).toBe(url);
  });
});

describe("isValidUrl", () => {
  it("should return true on valid url", () => {
    const validUrl = "https://www.google.com";
    expect(isValidUrl(validUrl)).toBe(true);
  });

  it("should return false on invalid url", () => {
    const invalidUrl = "www.google.com";
    expect(isValidUrl(invalidUrl)).toBe(false);
  });
});
