# html-to-file
Service to convert an html page or ejs service to a file (image or pdf) using [puppeteer](https://github.com/puppeteer/puppeteer).
The goal for this project is to be able to convert any html page into a file, or to convert custom `ejs` templates into a file.

File types that are currently supported are images (.png). Pdfs will be added soon.

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

When deployed, the service can be started with the command `npm run start`, which will compile .tsc files and start-up the node server.

## Demo
To demo this locally, start the server and enter this url into a browser
> http://localhost:4000/template/test?url=<your-url\>&type=image
