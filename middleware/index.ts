export const checkValidUrl = (req: any, res: any, next: Function) => {
  const url = req.query.url;
  const validUrlPattern = /^(http|https):\/\/www\..*\..*/;
  try {
    if (!validUrlPattern.test(url)) {
        throw new Error(
          "Invalid url. Expected url to match http(s)://www.domain.com"
        );
      }
      next()
  }
  catch (error){
    next(error);
  }
  };
