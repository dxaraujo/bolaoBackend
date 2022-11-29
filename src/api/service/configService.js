const express = require('express')
const Config = require('../model/config')
const { respondOrErr, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', (req, res, next) => {
	Config.find({}, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.use(handlerError)

exports = module.exports = router