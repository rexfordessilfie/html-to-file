import * as express from "express";
import { router as generateRoutes } from "./generate.routes";
import { router as fileRoutes } from "./file.routes";
import { router as templateRoutes } from "./template.routes";

const appRoutes = express.Router();

appRoutes.use("/file", fileRoutes);
appRoutes.use("/template", templateRoutes);
appRoutes.use("/generate", generateRoutes);

export { appRoutes, fileRoutes, templateRoutes, generateRoutes };
