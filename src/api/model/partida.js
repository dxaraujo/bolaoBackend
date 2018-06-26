const mongoose = require('mongoose')
const Time = require('./time')

const partidaSchema = new mongoose.Schema({
	order: {
		type: Number,
		required: true,
		default: 0
	},
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
			'SEM GRUPO'
		]
	},
	rodada: {
		type: String,
		required: false,
		enum: [
			'1ª RODADA',
			'2ª RODADA',
			'3ª RODADA',
			'SEM RODADA'
		]
	},
	data: {
		type: Date,
		required: true
	},
	timeA: {
		type: Time.schema,
		required: true
	},
	placarTimeA: {
		type: Number,
		required: false
	},
	timeB: {
		type: Time.schema,
		required: true
	},
	placarTimeB: {
		type: Number,
		required: false
	}
})

module.exports = mongoose.model('partida', partidaSchema)