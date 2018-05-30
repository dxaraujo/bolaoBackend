const mongoose = require('mongoose')

const faseSchema = new mongoose.Schema({
	nome: {
		type: mongoose.Schema.ObjectId,
		required: true
	},
	status: {

	}
})

module.exports = mongoose.model('fase', faseSchema)