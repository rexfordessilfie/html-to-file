export const checkValidUrl = (req: any, res: any, next: Function) => {
  const url = req.query.url;
  const validUrlPattern = /^(http|https):\/\/www\..*\..*/;
  try {
    if (!validUrlPattern.test(url)) {
      console.log("[Middleware] Invalid url received", { url });
      throw "Invalid url. Expected url to match http(s)://www.domain.com";
    }
    next();
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "An error occurred: " + error,
    });
  }
};
