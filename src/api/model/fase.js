const mongoose = require('mongoose')

const faseSchema = new mongoose.Schema({
	nome: {
		type: String,
		required: true
	},
	status: {
		type: Boolean,
		required: true,
		default: false
	}
})

module.exports = mongoose.model('fase', faseSchema)