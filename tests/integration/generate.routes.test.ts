import * as request from "supertest";
import { PORT } from "../../util/constants";
import { app as testApp } from "../../app";

describe("test-generate-routes", () => {
  it("GET /generate - should generate pdf given valid url", async () => {
    const { body } = await request(testApp).get(
      "/generate?url=https://www.google.com"
    );
    // Check that relevant information was returned
    expect(body).toHaveProperty("resourceLink");
    expect(body).toHaveProperty("downloadLink");
    expect(body).toHaveProperty("success");

    // Check that the file links are correct
    const fileLinkRe = new RegExp(
      `http://localhost:${PORT}/file/\(resource\|download\)/\.\*`
    );

    expect(fileLinkRe.test(body.resourceLink)).toBeTruthy();
    expect(fileLinkRe.test(body.downloadLink)).toBeTruthy();

    // TODO: Also check that the file was generated.
    // Will be easier once files are uploaded to a database instead of file system
  });

  it("GET /generate - should generate image given valid html string", async () => {
    const { body } = await request(testApp).get(
      "/generate?html=<h1>hello</h1>"
    );

    // Check that relevant information was returned
    expect(body).toHaveProperty("resourceLink");
    expect(body).toHaveProperty("downloadLink");
    expect(body).toHaveProperty("success");

    // Check that the file links are correct
    const fileLinkRe = new RegExp(
      `http://localhost:${PORT}/file/\(resource\|download\)/\.\*`
    );

    expect(fileLinkRe.test(body.resourceLink)).toBeTruthy();
    expect(fileLinkRe.test(body.downloadLink)).toBeTruthy();

    // TODO: Also check that the file was generated.
    // Will be easier once files are uploaded to a database instead of file system
  });

  it("GET /generate - should throw on invalid request", async () => {
    // Invalid request since no url or html string
    await request(testApp).get("/generate").expect(400);
  });
});
