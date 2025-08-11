require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configurações
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REDIRECT_URI = `${BASE_URL}/auth/discord/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'uma_chave_bem_segura';

// Armazenamento temporário (ideal: Redis ou DB)
const sessionStore = new Map();

/**
 * Middleware para validar o JWT interno
 */
function authenticateToken(req, res, next) {
    let token = req.cookies.holly_token;

    // Se não veio no cookie, tenta Authorization header
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
}

/**
 * Redireciona para login do Discord
 */
function login(req, res) {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds'
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
}

/**
 * Callback do Discord
 */
async function callback(req, res) {
    try {
        const { code } = req.query;
        if (!code) return res.redirect(`${FRONTEND_URL}/dashboard.html?error=no_code`);

        // Troca code por access_token
        const tokenResponse = await axios.post(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // Busca dados do usuário
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userId = userRes.data.id;

        // Armazena sessão com tokens
        sessionStore.set(userId, {
            access_token,
            refresh_token,
            expires_at: Date.now() + expires_in * 1000
        });

        // Cria JWT interno
        const jwtToken = jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('holly_token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none', // permite cross-site
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
        });

        res.redirect(`${FRONTEND_URL}/dashboard.html`);
    } catch (err) {
        console.error('Erro no callback:', err.response?.data || err.message);
        res.redirect(`${FRONTEND_URL}/dashboard.html?error=auth_failed`);
    }
}

/**
 * Função para renovar o token do Discord
 */
async function refreshAccessToken(userId, session) {
    try {
        const tokenResponse = await axios.post(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: session.refresh_token
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // Atualiza sessão
        sessionStore.set(userId, {
            access_token,
            refresh_token,
            expires_at: Date.now() + expires_in * 1000
        });

        console.log(`🔄 Token do Discord renovado para usuário ${userId}`);
        return access_token;
    } catch (err) {
        console.error('Erro ao renovar token do Discord:', err.response?.data || err.message);
        sessionStore.delete(userId);
        return null;
    }
}

/**
 * Garante que o token do Discord está válido, renova se necessário
 */
async function getValidAccessToken(userId) {
    const session = sessionStore.get(userId);
    if (!session) return null;

    // Se expirado → renovar
    if (Date.now() >= session.expires_at) {
        return await refreshAccessToken(userId, session);
    }

    return session.access_token;
}

/**
 * Logout
 */
function logout(req, res) {
    if (req.user?.user_id) {
        sessionStore.delete(req.user.user_id);
    }
    res.clearCookie('holly_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
    res.status(200).json({ message: 'Logout realizado com sucesso' });
}

/**
 * Buscar dados do usuário
 */
async function getUserData(req, res) {
    try {
        const token = await getValidAccessToken(req.user.user_id);
        if (!token) return res.status(401).json({ error: 'Sessão expirada' });

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        res.json({ ...userRes.data, plan: 'free' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
}

/**
 * Buscar guilds do usuário
 */
async function getUserGuilds(req, res) {
    try {
        const token = await getValidAccessToken(req.user.user_id);
        if (!token) return res.status(401).json({ error: 'Sessão expirada' });

        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${token}` }
        });

        res.json(guildsRes.data);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar servidores' });
    }
}

module.exports = {
    authenticateToken,
    login,
    callback,
    logout,
    getUserData,
    getUserGuilds
};
