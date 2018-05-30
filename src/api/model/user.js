const mongoose = require('mongoose')
const Palpite = require('./palpite')

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		min: 6,
		max: 20,
		required: true
	},
	avatar: {
		data: Buffer,
		contentType: String	
	},
	palpites: {
		type: [Palpite.schema],
		required: true,
		default: []
	}
})

module.exports = mongoose.model('user', userSchema)