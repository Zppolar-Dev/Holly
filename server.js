// Primeiro importe todos os módulos necessários
const path = require('path');
const express = require('express');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Depois inicialize o app Express
const app = express();
const port = process.env.PORT || 3000;

// Configurações do Discord OAuth2
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://dash-holly.com/auth/discord/callback';


// Verificação rigorosa das variáveis
if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('ERRO: Variáveis de ambiente não configuradas!');
    console.error('Certifique-se de que:');
    console.error('1. O arquivo .env existe na raiz do projeto');
    console.error('2. Contém DISCORD_CLIENT_ID e DISCORD_CLIENT_SECRET');
    console.error('3. Você reiniciou o servidor após criar/modificar o .env');
    process.exit(1);
}

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rota para evitar erro do favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Rota de autenticação
app.get('/auth/discord', (req, res) => {
    const scope = 'identify guilds';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
    console.log('Redirecionando para:', authUrl);
    res.redirect(authUrl);
});

// Callback do Discord
app.get('/auth/discord/callback', async (req, res) => {
    try {
        const { code, error } = req.query;
        
        if (error) {
            console.error('Erro do Discord:', error);
            return res.redirect('/dashboard.html?error=discord_' + error);
        }

        if (!code) {
            console.error('Código de autorização ausente');
            return res.redirect('/dashboard.html?error=no_code');
        }

        console.log('Recebido código de autorização, trocando por token...');

        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('scope', 'identify guilds');

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token } = tokenResponse.data;
        console.log('Autenticação bem-sucedida!');
        
        res.redirect(`/dashboard.html?token=${access_token}`);

    } catch (error) {
        console.error('Erro durante autenticação:', error.response?.data || error.message);
        res.redirect('/dashboard.html?error=auth_failed');
    }
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log('Configurações:');
    console.log('- CLIENT_ID:', CLIENT_ID ? 'OK' : 'FALTANDO');
    console.log('- CLIENT_SECRET:', CLIENT_SECRET ? 'OK' : 'FALTANDO');
    console.log('- REDIRECT_URI:', REDIRECT_URI);
});