import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3080;

const server = http.createServer((req, res) => {
    // Servir index.html para cualquier ruta (SPA fallback)
    const indexPath = path.join(__dirname, 'index.html');
    
    fs.readFile(indexPath, 'utf-8', (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('Error cargando index.html');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`>>> Servidor de prueba iniciado en puerto ${PORT}`);
    console.log(`>>> Accede a http://localhost:${PORT}`);
});
