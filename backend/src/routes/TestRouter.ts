import EXPRESS from "express";
import moment from "moment";
const currentTime = moment().format("MMMM Do YYYY, h:mm:ss a");

const ROUTER = EXPRESS.Router();

ROUTER.get("/", (_req, res, next) => {
  res.status(200).json({
    code: 0,
    message: `Time now is ${currentTime}`,
  });
  next();
});
export default ROUTER;
