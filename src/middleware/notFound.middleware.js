export const notFoundMiddleWare = (req, res, next) => {
  const error = new Error("Not a valid request");
  error.status = 404;
  next(error);
};
