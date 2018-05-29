const queryParser = require('express-query-int')
const bodyParser = require('body-parser')
const allowCors = require('cors')
const express = require('express')
const server = express()

const port = process.env.PORT || 3001
const database = require('./config/database')
const { oapi, api } = require('./config/router')

server.use(allowCors())
server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use(queryParser())

server.use('/', oapi)
server.use('/api', api)

server.listen(port, () => {
	console.log(`BACKEND is running on port ${port}.`)
	database.then(() => {
		console.log('DATABASE is running')
	})
})