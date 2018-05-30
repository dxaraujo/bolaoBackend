const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../model/user')
const env = require('../../env')

const passwordRegex = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%]).{6,20})/

const auth = (req, res, next) => {

	if (req.method === 'OPTIONS') {

		next()

	} else {

		var token = req.body.token || req.query.token || req.headers['authorization'] || ''
		token = token.split(' ')[1]
		if (!token) {
			return res.status(403).send({
				errors: ['No token provided.']
			})
		}

		jwt.verify(token, env.authSecret, function (err, decoded) {
			if (err) {
				return res.status(403).send({
					errors: ['Failed to authenticate token.']
				})
			} else {
				next()
			}
		})
	}
}

const login = (req, res) => {

	const username = req.body.username || ''
	const password = req.body.password || ''

	User.findOne({ username }, (err, user) => {
		if (err) {
			console.log(err)
		} else if (user && bcrypt.compareSync(password, user.password)) {
			const token = jwt.sign(user.toJSON(), env.authSecret, { expiresIn: "1 day" })
			const { name, username, avatar } = user
			res.json({ name, username, avatar, token })
		} else {
			return res.status(400).send({
				errors: ['Usuário/Senha inválidos']
			})
		}
	})
}

const validateToken = (req, res) => {

	const token = req.body.token || ''

	jwt.verify(token, env.authSecret, (err, decoded) => {
		return res.status(200).send({ valid: !err })
	})
}

const signup = (req, res) => {

	const name = req.body.name || ''
	const username = req.body.username || ''
	const password = req.body.password || ''
	const confirmPassword = req.body.confirmPassword || ''

	if (!password.match(passwordRegex)) {
		return res.status(400).send({
			errors: [
				"Senha precisar ter: uma letra maiúscula, uma letra minúscula, um número, uma caractere especial(@#$%) e ter tamanho entre 6-20."
			]
		})
	}

	const salt = bcrypt.genSaltSync()
	const passwordHash = bcrypt.hashSync(password, salt)

	if (!bcrypt.compareSync(confirmPassword, passwordHash)) {
		return res.status(400).send({
			errors: ['Senhas não conferem.']
		})
	}

	User.findOne({ username }, (err, user) => {
		if (err) {
			console.log(err)
		} else if (user) {
			return res.status(400).send({
				errors: ['Usuário já cadastrado.']
			})
		} else {
			const newUser = new User({ name, username, password: passwordHash })
			newUser.save(err => {
				if (err) {
					console.log(err)
				} else {
					login(req, res)
				}
			})
		}
	})
}

module.exports = { auth, login, signup, validateToken }