const express = require("express");
const { respondOrErr, handlerError } = require("../../util/serviceUtils");

const router = express.Router();

router.get("/", (req, res, next) => {
	const healthcheck = {
		uptime: process.uptime(),
		message: "OK",
		timestamp: Date.now(),
	};
	respondOrErr(res, next, 500, undefined, 200, healthcheck);
});

router.use(handlerError);

exports = module.exports = router;
