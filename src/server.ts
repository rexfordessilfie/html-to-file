import * as express from "express";

const app = express();
const port = process.env.PORT || 4000;


try {
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}!`);
  });
} catch (error) {
  console.log(error);
}
