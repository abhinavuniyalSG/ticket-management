import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  console.log("hit");
  res.status(200).json("Server is live !!!");
});
export default router;
