require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações OAuth2 com fallbacks para desenvolvimento
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = process.env.FRONTEND_URL || BASE_URL;
const REDIRECT_URI = `${BASE_URL}/auth/discord/callback`;
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

// Verificação das variáveis de ambiente críticas
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERRO: Variáveis de ambiente DISCORD_CLIENT_ID e DISCORD_CLIENT_SECRET são obrigatórias');
  process.exit(1);
}

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(helmet());

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const token = req.cookies.holly_token || req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Não autorizado - Token não fornecido' });
  }

  try {
    // Verificação básica do token (em produção use jsonwebtoken)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    if (payload.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'Token expirado' });
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// Rota de autenticação com Discord
app.get('/auth/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
    prompt: 'none'
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// Rota de callback do Discord
app.get('/auth/discord/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
      console.error(`Erro do Discord: ${error} - ${error_description}`);
      return res.redirect(`${FRONTEND_URL}/dashboard.html?error=auth_failed`);
    }

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/dashboard.html?error=no_code`);
    }

    // Troca o code por access_token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      scope: 'identify guilds'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Configura o cookie seguro
    res.cookie('holly_token', tokenResponse.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenResponse.data.expires_in * 1000,
      path: '/',
      domain: COOKIE_DOMAIN
    });

    res.redirect(`${FRONTEND_URL}/dashboard.html`);

  } catch (error) {
    console.error('ERRO NO CALLBACK:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/dashboard.html?error=auth_failed`);
  }
});

// Rota de logout
app.post('/auth/logout', (req, res) => {
  res.clearCookie('holly_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: COOKIE_DOMAIN
  });
  res.status(200).json({ message: 'Logout realizado com sucesso' });
});

// API - Dados do usuário
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { 'Authorization': `Bearer ${req.token}` }
    });
    
    res.json({
      ...userRes.data,
      plan: 'free' // Adicione dados adicionais do usuário aqui
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados do usuário',
      details: error.response?.data || error.message
    });
  }
});

// API - Servidores do usuário
app.get('/api/user/guilds', authenticateToken, async (req, res) => {
  try {
    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { 'Authorization': `Bearer ${req.token}` }
    });
    
    // Filtra apenas servidores com permissão de gerenciamento
    const manageableGuilds = guildsRes.data.filter(guild => guild.permissions & 0x20);
    
    res.json(manageableGuilds);
  } catch (error) {
    console.error('Erro ao buscar servidores:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar servidores',
      details: error.response?.data || error.message
    });
  }
});

// API - Estatísticas do bot
app.get('/api/stats', async (req, res) => {
  try {
    // Dados simulados - substitua por dados reais do seu bot
    const stats = {
      commands_24h: Math.floor(Math.random() * 2000) + 500,
      unique_users: Math.floor(Math.random() * 5000) + 1000,
      uptime: 99.8,
      commands_by_hour: Array(24).fill().map(() => Math.floor(Math.random() * 100)),
      command_categories: {
        moderation: 35,
        fun: 25,
        utility: 20,
        music: 15,
        other: 5
      },
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao gerar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar estatísticas',
      details: error.message
    });
  }
});

// Rotas estáticas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno no servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`
  =============================================
  🚀 Servidor Holly iniciado na porta ${PORT}
  =============================================
  Modo: ${process.env.NODE_ENV || 'development'}
  Client ID: ${CLIENT_ID}
  Base URL: ${BASE_URL}
  Frontend URL: ${FRONTEND_URL}
  =============================================
  Rotas disponíveis:
  - GET /              -> Página inicial
  - GET /dashboard.html -> Painel de controle
  - GET /auth/discord  -> Iniciar autenticação
  - GET /api/user      -> Dados do usuário
  - GET /api/stats     -> Estatísticas do bot
  =============================================
  `);
});

// Tratamento de erros globais
process.on('unhandledRejection', (err) => {
  console.error('Rejeição não tratada:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada:', err);
  process.exit(1);
});