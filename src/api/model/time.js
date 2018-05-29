const mongoose = require('mongoose')

const timeSchema = new mongoose.Schema({
	nome: {
		type: String,
		required: true
	},
	sigla: {
		type: String,
		required: true
	},
	bandeira: {
		type: String,
		required: true
	}
})

module.exports = mongoose.model('time', timeSchema)