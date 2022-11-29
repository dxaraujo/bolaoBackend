const express = require('express')
const { authService, faseService, palpiteService, partidaService, timeService, userService, healthService, configService } = require('../api')

/*
 * Rotas abertas
 */
const oapi = express.Router()

oapi.get('/healthcheck', healthService.healthcheck)
oapi.post('/registerGoogleUser', authService.registerGoogleUser)

/**
 * Rotas seguras
 */
const api = express.Router()
api.use(authService.auth)
api.use('/fase', faseService)
api.use('/palpite', palpiteService)
api.use('/partida', partidaService)
api.use('/time', timeService)
api.use('/user', userService)
api.use('/config', configService)

module.exports = { api, oapi }