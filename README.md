# html-to-file
Service to convert an html page or ejs service to a file (image or pdf)

## Development
To run in a development environment, use the following command
```
npm run dev
```

## Deployment
Make sure to set `BASE_URL` in `.env` file when deployed. This env variable will be sent back to clients so that they can access files they have generated.

When deployed, the service can be started with the command `npm run start`, which will compile .tsc files and start-up the node server.

