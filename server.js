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
                input { padding: 10px; width: 60%; max-width: 500px; border-radius: 5px; border: none; }
                button { padding: 10px 20px; border-radius: 5px; border: none; background: #00adb5; color: white; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>📱 Mein Web Proxy</h1>
            <p>Gib eine URL ein (z.B. https://example.com):</p>
            <form action="/go" method="get">
                <input type="text" name="url" placeholder="https://example.com" required>
                <button type="submit">Los</button>
            </form>
        </body>
        </html>
    `);
});

app.get('/go', async (req, res) => {
    let target = req.query.url;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = 'https://' + target;
    }
    try {
        const response = await fetch(target);
        const body = await response.text();
        res.send(body);
    } catch (err) {
        res.status(500).send("Proxy-Fehler: " + err.message);
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('Proxy läuft auf Port ' + port);
});
