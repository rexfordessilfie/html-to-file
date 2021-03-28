export const checkValidUrl = (req: any, res: any, next: Function) => {
  const url = req.query.url;
  const validUrlPattern = /^(http|https):\/\//;
  try {
    if (!validUrlPattern.test(url)) {
      console.log("[Middleware] Invalid url received", { url });
      throw "Invalid url protocol. Expected url to have protocol, https:// or http://";
    }
    next();
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error,
    });
  }
};
