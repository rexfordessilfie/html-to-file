import { isValidUrl } from "../util/helpers";

export const checkValidUrl = (req: any, res: any, next: Function) => {
  const { url } = req.query;
  try {
    if (!isValidUrl(url)) {
      console.log("[Middleware] Invalid url received", { url });
      throw "Invalid url protocol. Expected url to have protocol, https:// or http://";
    }
    next();
  } catch (error) {
    res.status(400).send({
      error,
    });
  }
};
