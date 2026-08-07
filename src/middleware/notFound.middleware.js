export const notFoundMiddleWare = (req, res) => {
  res.status(404).json({ message: "Not a valid request" });
};
