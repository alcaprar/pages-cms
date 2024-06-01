import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
let config = dotenv.config().parsed;
console.log(config)
const __dirname = import.meta.dirname;

const app = express();

const SERVER_PORT = config.SERVER_PORT || 3000;

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });

app.use('/', express.static(path.join(__dirname, '../dist/')));

app.get("/auth/callback", async (request, response) => {
    console.log('GET /auth/callback')
    const url = new URL(`${request.protocol}://${request.get('host')}${request.originalUrl}`);

    if (url.searchParams.has('code')) {
        const login_response = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            client_id: config.GITHUB_CLIENT_ID,
            client_secret: config.GITHUB_CLIENT_SECRET,
            code: url.searchParams.get('code'),
            redirect_uri: `${config.BASE_URL}/auth/callback`,
          }),
        });
    

        if (!login_response.ok) {
            const errorText = await login_response.text();
            console.error(login_response);
            throw new Error(`Error fetching access token: ${login_response.statusText}. GitHub says: ${errorText}`);
        }

        const responseData = await login_response.json();
        
        if (responseData.access_token) {
        return response.redirect(`${config.BASE_URL}/?access_token=${responseData.access_token}`);
        } else {
        throw new Error('Access token not found');
        }
    }

    return response.status(400).send("Invalid request");
});

app.get("/auth/login", (request, response) => {
    console.log('GET /auth/login')
    const url = new URL(`${request.protocol}://${request.get('host')}${request.originalUrl}`);
    const redirect_uri = `${url.origin}/auth/callback`;
    console.log(redirect_uri)

    return response.redirect(`https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=repo`);
})

app.get("/auth/revoke", async (request, response) => {
    const url = new URL(`${request.protocol}://${request.get('host')}${request.originalUrl}`);
    const token = url.searchParams.get('token');

    if (!token) {
        return response.status(400).send("Token parameter is required");
      }
    
      const grant_response = await fetch(`https://api.github.com/applications/${config.GITHUB_CLIENT_ID}/grant`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${btoa(`${config.GITHUB_CLIENT_ID}:${config.GITHUB_CLIENT_SECRET}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Pages CMS'
        },
        body: JSON.stringify({
          access_token: token
        })
      });
    
      if (!grant_response.ok) {
        const errorText = await grant_response.text();
        throw new Error(`Error revoking access token: ${grant_response.statusText}. GitHub says: ${errorText}`);
      }
    
      return response.status(200).send("Token revoked");
})

app.listen(SERVER_PORT, () => {
    console.log(`Listen on the port ${SERVER_PORT}...`);
});