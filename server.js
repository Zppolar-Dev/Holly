const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
require('dotenv').config()

const discordAuth = require('./public/js/discordAuth')

const app = express()
const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// Controle simples de flood no callback
const callbackHits = new Map()
const CALLBACK_WINDOW = 5000 // 5 segundos

function callbackLimiter(req, res, next) {
    const ip = req.ip
    const now = Date.now()
    if (callbackHits.has(ip) && now - callbackHits.get(ip) < CALLBACK_WINDOW) {
        return res.status(429).send('Muitas tentativas de login, tente novamente em alguns segundos.')
    }
    callbackHits.set(ip, now)
    next()
}

app.use(express.json())
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors({ origin: FRONTEND_URL, credentials: true }))
app.use(helmet())

// Rotas de autenticação
app.get('/auth/discord', discordAuth.login)
app.get('/auth/discord/callback', callbackLimiter, discordAuth.callback)
app.post('/auth/logout', discordAuth.authenticateToken, discordAuth.logout)

// Rotas API
app.get('/api/user', discordAuth.authenticateToken, discordAuth.getUserData)
app.get('/api/user/guilds', discordAuth.authenticateToken, discordAuth.getUserGuilds)

// Rotas estáticas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')))

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
