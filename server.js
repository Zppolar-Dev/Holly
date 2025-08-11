const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const discordAuth = require('./public/js/discordAuth');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(helmet());

// Rotas de autenticação
app.get('/auth/discord', discordAuth.login);
app.get('/auth/discord/callback', discordAuth.callback);
app.post('/auth/logout', discordAuth.authenticateToken, discordAuth.logout);

// Rotas API
app.get('/api/user', discordAuth.authenticateToken, discordAuth.getUserData);
app.get('/api/user/guilds', discordAuth.authenticateToken, discordAuth.getUserGuilds);

// 📊 Rota fake de estatísticas para o dashboard
app.get('/api/stats', (req, res) => {
    res.json({
        commands_24h: 0,
        unique_users: 0,
        uptime: 100,
        command_categories: {
            moderation: 0,
            fun: 0,
            utility: 0,
            music: 0,
            other: 0
        },
        commands_by_hour: Array(24).fill(0)
    });
});

// Rotas estáticas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
