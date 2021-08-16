import * as express from "express";
import { appRoutes } from "../../routes";

export const setupTestApp = () => {
  const app = express();
  app.use(appRoutes);
  return app;
};
