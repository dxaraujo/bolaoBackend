const mongoose = require('mongoose')

const configSchema = new mongoose.Schema({
	atualizandoPontuacoes: {
		type: Boolean,
		required: true
	}
})

module.exports = mongoose.model('config', configSchema)