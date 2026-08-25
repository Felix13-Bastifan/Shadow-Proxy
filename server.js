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

// Fängt ALLES ab (Suchanfragen, Bilder, Scripte wie /search oder /images)
app.use(async (req, res) => {
    let targetUrl = req.url;

    // Falls die Anfrage über das Eingabefeld kommt (/go?url=...)
    if (req.path === '/go' && req.query.url) {
        let url = req.query.url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        try {
            const parsed = new URL(url);
            // Wir merken uns die Hauptseite in einem Cookie
            res.cookie('proxy_target', parsed.origin, { httpOnly: true, sameSite: 'lax' });
            targetUrl = url;
        } catch (e) {
            return res.status(400).send("Ungültige URL");
        }
    } else {
        // Falls eine Unterseite aufgerufen wird (z.B. /search), holen wir uns die Domain aus dem Cookie
        const cookies = req.headers.cookie ? Object.fromEntries(req.headers.cookie.split('; ').map(c => c.split('='))) : {};
        const base = cookies['proxy_target'];
        
        if (!base) {
            // Wenn kein Cookie da ist, schicken wir den User zurück zur Startseite
            return res.redirect('/');
        }
        targetUrl = base + req.url;
    }

    // Seite abrufen und an den Browser ausliefern
    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0' }
        });
        
        const contentType = response.headers.get('content-type') || '';
        
        // Wenn es sich um eine Text/HTML-Seite handelt, liefern wir sie aus
        if (contentType.includes('text/html')) {
            const body = await response.text();
            res.send(body);
        } else {
            // Bilder, CSS und andere Medien direkt unverändert weiterleiten
            const buffer = await response.arrayBuffer();
            res.set('Content-Type', contentType);
            res.send(Buffer.from(buffer));
        }
    } catch (err) {
        res.status(500).send("Proxy-Fehler beim Laden von von von " + targetUrl + ": " + err.message);
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('Stabiler Vanilla-Proxy läuft auf Port ' + port);
});
