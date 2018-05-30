const mongoose = require('mongoose')

const partidaSchema = new mongoose.Schema({
	fase: {
		type: String,
		required: true,
		enum: [
			'FASE DE GRUPOS',
			'OITAVAS DE FINAL',
			'QUARTAS DE FINAL',
			'SEMIFINAL',
			'DISPUTA DO 3º LUGAR',
			'FINAL'
		]
	},
	grupo: {
		type: String,
		required: false,
		enum: [
			'GRUPO A',
			'GRUPO B',
			'GRUPO C',
			'GRUPO D',
			'GRUPO E',
			'GRUPO F',
			'GRUPO G',
			'GRUPO H',
			'GRUPO ÚNICO'
		]
	},
	rodada: {
		type: String,
		required: false,
		enum: [
			'1ª RODADA',
			'2ª RODADA',
			'3ª RODADA',
			'RODADA ÚNICA'
		]
	},
	data: {
		type: Date,
		required: true
	},
	timeA: {
		type: mongoose.Schema.ObjectId,
		required: true
	},
	placarTimeA: {
		type: Number,
		required: true
	},
	timeB: {
		type: mongoose.Schema.ObjectId,
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

module.exports = mongoose.model('partida', partidaSchema)