document.addEventListener('DOMContentLoaded', function() {
    // Elementos da UI
    const loginBtn = document.getElementById('login-btn');
    const userAvatar = document.getElementById('user-avatar');
    const username = document.getElementById('username');
    const userDiscriminator = document.getElementById('user-discriminator');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const serversGrid = document.querySelector('.servers-grid');

    // Configurações do OAuth2
    const clientId = '1069819161057968218'; // Substitua pelo seu Client ID
    const redirectUri = encodeURIComponent('https://holly-j4a7.onrender.com/auth/discord/callback'); // Ou seu domínio
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds`;

    // Verificar se já está autenticado
    function checkAuth() {
        const token = localStorage.getItem('discord_token');
        if (token) {
            fetchUserData(token);
            return true;
        }
        return false;
    }

    // Obter dados do usuário
    async function fetchUserData(token) {
        try {
            // Obter informações básicas do usuário
            const userRes = await fetch('https://discord.com/api/users/@me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!userRes.ok) throw new Error('Failed to fetch user data');
            
            const userData = await userRes.json();
            updateUserUI(userData);

            // Obter servidores do usuário
            const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (guildsRes.ok) {
                const guildsData = await guildsRes.json();
                updateServersUI(guildsData);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            logout();
        }
    }

    // Atualizar a UI com dados do usuário
    function updateUserUI(user) {
        const avatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        
        userAvatar.src = avatarUrl;
        username.textContent = user.username;
        userDiscriminator.textContent = `#${user.discriminator}`;
        statusDot.style.backgroundColor = '#2ecc71';
        statusText.textContent = 'Online';
        
        loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    }

    // Atualizar a lista de servidores
    function updateServersUI(guilds) {
        serversGrid.innerHTML = '';
        
        guilds.forEach(guild => {
            const serverCard = document.createElement('div');
            serverCard.className = 'server-card';
            
            const icon = guild.icon 
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : guild.name.charAt(0);
            
            serverCard.innerHTML = `
                <div class="server-icon" style="${!guild.icon ? 'background-color: #5f27cd; color: white; font-size: 1.5rem;' : ''}">
                    ${guild.icon ? `<img src="${icon}" alt="${guild.name}">` : icon}
                </div>
                <p>${guild.name}</p>
            `;
            
            serversGrid.appendChild(serverCard);
        });
    }

    // Logout
    function logout() {
        localStorage.removeItem('discord_token');
        userAvatar.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        username.textContent = 'Não Logado';
        userDiscriminator.textContent = '#0000';
        statusDot.style.backgroundColor = '#ccc';
        statusText.textContent = 'Offline';
        
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login com Discord';
        
        serversGrid.innerHTML = `
            <div class="server-card">
                <div class="server-icon">
                    <i class="fas fa-sign-in-alt"></i>
                </div>
                <p>Faça login para ver seus servidores</p>
            </div>
        `;
    }

    // Manipulador de login/logout
    loginBtn.addEventListener('click', function() {
        if (loginBtn.textContent.includes('Login')) {
            // Redirecionar para autenticação do Discord
            window.location.href = discordAuthUrl;
        } else {
            logout();
        }
    });

    // Verificar parâmetros de URL para token (simulação do callback)
    function checkUrlForToken() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            localStorage.setItem('discord_token', token);
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchUserData(token);
        }
    }

    // Inicializar
    checkUrlForToken();
    if (!checkAuth()) {
        // Mostrar estado não logado
        logout();
    }

    // Menu mobile
    const hamburger = document.getElementById('hamburger');
    const navbarLinks = document.getElementById('navbarLinks');
    
    if (hamburger && navbarLinks) {
        hamburger.addEventListener('click', function() {
            navbarLinks.classList.toggle('active');
        });
    }
});