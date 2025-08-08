require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações OAuth2
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'https://holly-j4a7.onrender.com';
const REDIRECT_URI = `${BASE_URL}/auth/discord/callback`;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de autenticação
function authenticateToken(req, res, next) {
    const token = req.cookies.holly_token || req.query.token;
    if (!token) return res.status(401).json({ error: 'Não autorizado' });
    req.token = token;
    next();
}

// Inicia fluxo OAuth2
app.get('/auth/discord', (req, res) => {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds'
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// Callback do OAuth2
app.get('/auth/discord/callback', async (req, res) => {
    try {
        const { code, error } = req.query;
        if (error) return res.redirect('/dashboard.html?error=auth_failed');
        if (!code) return res.redirect('/dashboard.html?error=no_code');

        // Troca code por access_token do usuário
        const tokenResponse = await axios.post(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                scope: 'identify guilds'
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const userAccessToken = tokenResponse.data.access_token;

        // Salva token em cookie HTTP-only
        res.cookie('holly_token', userAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: tokenResponse.data.expires_in * 1000
        });

        // Passa o token para o front-end via URL (para o dashboard.js salvar no localStorage)
        res.redirect(`/dashboard.html?token=${userAccessToken}`);
    } catch (err) {
        console.error('Erro no callback OAuth2:', err.response?.data || err.message);
        res.redirect('/dashboard.html?error=auth_failed');
    }
});

// Rota de dados do usuário
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${req.token}` }
        });
        res.json({ ...userRes.data, plan: 'free' });
    } catch {
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// Rota de guilds do usuário
app.get('/api/user/guilds', authenticateToken, async (req, res) => {
    try {
        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { 'Authorization': `Bearer ${req.token}` }
        });
        res.json(guildsRes.data);
    } catch {
        res.status(500).json({ error: 'Erro ao buscar servidores' });
    }
});

// Rota de estatísticas
app.get('/api/stats', (req, res) => {
    res.json({
        commands_24h: 1250,
        unique_users: 842,
        uptime: 99.8,
        commands_by_hour: Array(24).fill().map(() => Math.floor(Math.random() * 100)),
        command_categories: { moderation: 35, fun: 25, utility: 20, music: 15, other: 5 }
    });
});

// Rotas estáticas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
