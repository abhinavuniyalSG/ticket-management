export const fallbackController = (req, res) => {
  res.status(404).end("Not a valid request");
};
