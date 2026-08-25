const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mein Web Proxy</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; background: #121212; color: white; }
                input { padding: 10px; width: 60%; max-width: 500px; border-radius: 5px; border: none; font-size: 16px; }
                button { padding: 10px 20px; border-radius: 5px; border: none; background: #00adb5; color: white; cursor: pointer; font-size: 16px; }
            </style>
        </head>
        <body>
            <h1>📱 Mein Web Proxy</h1>
            <p>Gib eine URL ein (z.B. https://google.de):</p>
            <form action="/go" method="get">
                <input type="text" name="url" placeholder="https://google.de" required>
                <button type="submit">Los</button>
            </form>
        </body>
        </html>
    `);
});

app.use(async (req, res) => {
    let targetUrl = req.url;

    if (req.path === '/go' && req.query.url) {
        // WICHTIG: Hier decodieren wir die URL, damit %3A%2F%2F wieder zu :// wird
        let url = decodeURIComponent(req.query.url);
        
        if (url.startsWith('//')) {
            url = 'https:' + url;
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        try {
            const parsed = new URL(url);
            res.cookie('proxy_target', parsed.origin, { httpOnly: true, sameSite: 'lax' });
            targetUrl = url;
        } catch (e) {
            return res.status(400).send("Ungültige URL: " + url);
        }
    } else {
        const cookies = req.headers.cookie ? Object.fromEntries(req.headers.cookie.split('; ').map(c => c.split('='))) : {};
        let base = cookies['proxy_target'];
        
        if (!base) {
            return res.redirect('/');
        }
        
        // Auch die im Cookie gespeicherte Basis-URL wird zur Sicherheit decodiert
        base = decodeURIComponent(base);
        targetUrl = base + req.url;
    }

    try {
        const response = await fetch(targetUrl, {
            headers: { 
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                'Accept-Language': req.headers['accept-language'] || 'de-DE,de;q=0.9'
            }
        });
        
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('text/html')) {
            const body = await response.text();
            res.send(body);
        } else {
            const buffer = await response.arrayBuffer();
            res.set('Content-Type', contentType);
            res.send(Buffer.from(buffer));
        }
    } catch (err) {
        res.status(500).send("Proxy-Fehler beim Laden von " + targetUrl + ": " + err.message);
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('Stabiler Vanilla-Proxy läuft auf Port ' + port);
});
