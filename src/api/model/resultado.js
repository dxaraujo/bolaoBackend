const mongoose = require('mongoose')

const resultadoSchema = new mongoose.Schema({
	placarTimeA: {
		type: Number,
		required: true
	},
	placarTimeB: {
		type: Number,
		required: true
	},
	resultadoPartida: {
		type: String,
		required: true
	}
})

module.exports = mongoose.model('resultado', resultadoSchema)