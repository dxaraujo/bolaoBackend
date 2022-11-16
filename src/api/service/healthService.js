const { respondOrErr } = require("../../util/serviceUtils");

const healthcheck = (req, res, next) => {
	const healthcheck = {
		uptime: process.uptime(),
		message: "OK",
		timestamp: Date.now(),
	};
	respondOrErr(res, next, 500, undefined, 200, healthcheck);
};

module.exports = { healthcheck }
