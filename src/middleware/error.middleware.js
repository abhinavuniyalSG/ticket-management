const errorMiddleware = (error, req, res, next) => {
  console.error(error);
  return res.status(error.status || 500).json({
    message: error.message || "Internal server error.",
  });
};

export { errorMiddleware };
