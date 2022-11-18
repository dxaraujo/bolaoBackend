const googleAuth = require('google-auth-library');
const jwt = require('jsonwebtoken')
const User = require('../model/user')
const env = require('../../env')

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
				req.token = decoded
				next()
			}
		})
	}
}

const registerGoogleUser = (req, res) => {
	const client = new googleAuth.OAuth2Client(env.googleId);
	async function verify() {
		const ticket = await client.verifyIdToken({ idToken: req.query.token, audience: env.googleId });
		const payload = ticket.getPayload();
		const email = payload['email'];
		const name = payload['name'];
		const picture = payload['picture'];
		User.findOne({ email }, (err, user) => {
			if (err) {
				console.log(err)
			} else {
				if (user) {
					login(user, res)
				} else {
					signup({ name, email, picture }, res)
				}
			}
		})
	}
	verify().catch(console.error)
}

const login = (user, res) => {
	const token = jwt.sign(user.toJSON(), env.authSecret, { expiresIn: "30 days" })
	res.json({ token })
}

const signup = (user, res) => {
	let newUser = new User(user)
	newUser.save((err, user) => {
		if (err) {
			console.log(err)
		}
		login(user, res)
	})
}

module.exports = { auth, registerGoogleUser }