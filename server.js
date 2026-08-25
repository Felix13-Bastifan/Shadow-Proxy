const express = require('express');
const Corrosion = require('corrosion');
const app = express();

// Hier wird die schlaue Proxy-Engine gestartet
const proxy = new Corrosion({
    prefix: '/proxy/', // Alle umgeleiteten Seiten laufen über diesen Ordner
    codec: 'xhtml',    // Sorgt dafür, dass Links und Formulare umgeschrieben werden
    title: 'Mein Web Proxy'
});

// Die Hauptseite (Eingabefeld)
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
                .info { color: #888; margin-top: 20px; font-size: 14px; }
            </style>
        </head>
        <body>
            <h1>📱 Mein Web Proxy</h1>
            <p>Gib eine URL ein, um anonym zu surfen:</p>
            <form action="/go" method="get" onsubmit="let url=this.url.value; if(!url.startsWith('http')){url='https://'+url}; this.action='/proxy/'+url; return true;">
                <input type="text" name="url" placeholder="https://google.de" required>
                <button type="submit">Los</button>
            </form>
            <p class="info">Unterstützt Google-Suchen, Links und Formulare.</p>
        </body>
        </html>
    `);
});

// Leitet alle Anfragen an die Proxy-Engine weiter
app.use((req, res) => {
    proxy.request(req, res);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('Professioneller Proxy läuft auf Port ' + port);
});

