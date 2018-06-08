const express = require('express')

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array)
	}
}

const respondOrErr = (res, next, errStatusCode, err, statusCode, data) => {
	if (err) {
		respondErr(next, errStatusCode, err)
	} else {
		respondSuccess(res, statusCode, data)
	}
};

const respondSuccess = (res, statusCode, data) => {
	res.status(statusCode).json(data);
};

const respondErr = (next, errStatusCode, err) => {
	err.statusCode = errStatusCode
	next(err)
};

const handlerError = (err, req, res, next) => {
	const message = err.message
	res.status(err.statusCode).json({ errors: message });
};

const createService = (model) => {

	const router = express.Router()

	const list = function (req, res, next) {
		model.find(req.query, (err, data) => {
			respondOrErr(res, next, 500, err, 200, { data })
		});
	}

	const get = function (req, res, next) {
		model.findById(req.params.id, (err, data) => {
			respondOrErr(res, next, 500, err, 200, { data })
		});
	}

	const post = function (req, res, next) {
		model.create(req.body, (err, data) => {
			respondOrErr(res, next, 400, err, 201, { data })
		})
	}

	const put = function (req, res, next) {
		model.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, data) => {
			respondOrErr(res, next, 500, err, 200, { data })
		})
	}

	const del = function (req, res, next) {
		model.findByIdAndRemove(req.params.id, req.body, (err, data) => {
			respondOrErr(res, next, 500, err, 200, { data })
		})
	}

	router.get('/', list.bind(this))
	router.get('/:id', get.bind(this))
	router.post('/', post.bind(this))
	router.put('/:id', put.bind(this))
	router.delete('/:id', del.bind(this))
	router.use(handlerError)

	return router
}

module.exports = { createService, respondOrErr, respondErr, respondSuccess, handlerError, asyncForEach }