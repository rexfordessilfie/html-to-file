# html-to-file
Service to convert an html page or ejs service to a file (image or pdf) using [puppeteer](https://github.com/puppeteer/puppeteer).
The goal for this project is to be able to convert any html page into a file, or to convert custom `ejs` templates into a file.

File types that are currently supported are images (.png). Pdfs will be added soon.

## Usage
This service is currently hosted on Heroku here: https://html-to-file.herokuapp.com/generate?url=https://www.google.com (you may change the url to the one you would like to capture). Here are the services supported endpoints:

1. **`/generate:`** This generates a file from the webpage for the specified url and responds with a link to the file.
  The supported query params for this endpoint are:
    - url (required): the url of the page to be converted into a file
    - type: defaults to image, unless otherwise specified
    - selector (image only): a css selector that targets an html element to be captured
    - respondWithResource: if added, redirects to url that opens file in browser
    - respondWithDownload: if added, redirects to url that downloads file in browser
    - fallbackUrl: allows you to specify a url that accessors of the link will be shown when they try to access a link to a generated resource that is no longer available. Such a link could be to your custom page allowing the user to regenerate the resource, or directly be a link to regenerate the same resource with this service. Eg. https://html-to-file.herokuapp.com/generate?url=https://www.google.com?fallbackUrl=https://html-to-file.herokuapp.com/generate?url=https://www.google.com

  
  Files are deleted immediately after the link is accessed, or 30 seconds after creation.


## Development
Here are the steps to get you up and running in a development environment:
1. Install `node` (and `npm`) if you haven't already from [here](https://nodejs.org/en/download/), as well as `tsc`, `ts-node` and `nodemon`, using
```
npm install -g tsc ts-node nodemon
```
  Do not add `-g` flag if you only want to install them for this project.

2. Install dependencies for the project using the command,
```
npm install
```
3. Start the server in the development environment, using
```
npm run dev
```

## Deployment
Make sure to set `BASE_URL` in `.env` file when deployed. This env variable will be sent back to clients so that they can access files they have generated.

If deploying to heroku, you may have to manually set some buildpacks for puppeteer to run.

When deployed, the service can be started with the command `npm run start`, which will compile .tsc files and start-up the node server.

## Demo
To demo this locally, start the server and enter this url into a browser
> http://localhost:4000/template/test?url=http://www.google.com&type=image

To demo on live heroku site, enter this url into browser
> https://html-to-file.herokuapp.com/template/test?url=http://www.google.com&type=image
