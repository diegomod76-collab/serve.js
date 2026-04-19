const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();

// Carrega as configurações do seu arquivo
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const PORT = process.env.PORT || 10000;

app.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) return res.status(400).send('Código não encontrado.');

    try {
        // 1. Troca o código pelo token do usuário
        const params = new URLSearchParams();
        params.append('client_id', config.clientId);
        params.append('client_secret', config.clientSecret);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        // Pega o redirect_uri puro (tirando a parte do authorize do Discord)
        params.append('redirect_uri', 'https://' + req.get('host') + '/callback');

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;

        // 2. Pega quem é o usuário
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const userData = userResponse.data;

        // 3. Coloca ele no servidor (GuildId do seu config)
        // OBS: O cargo (Role) aqui eu deixei um padrão, se tiver no config pode trocar
        await axios.put(
            `https://discord.com/api/guilds/${config.guildId}/members/${userData.id}`,
            { access_token: accessToken },
            { headers: { Authorization: `Bot ${config.token}` } }
        );

        // Página de sucesso
        res.send(`
            <body style="background-color: #313338; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
                <div style="text-align: center; background: #2b2d31; padding: 50px; border-radius: 15px;">
                    <h1 style="color: #23a559;">✅ Verificado!</h1>
                    <p>Olá <b>${userData.username}</b>, sua conta foi verificada na Prime Store.</p>
                </div>
            </body>
        `);

    } catch (error) {
        console.error('Erro:', error.response?.data || error.message);
        res.status(500).send('Erro na verificação. Avise ao dono da loja.');
    }
});

app.listen(PORT, () => console.log(`Servidor online na porta ${PORT}`));
    }
});

app.listen(PORT, () => console.log(`Servidor online na porta ${PORT}`));
