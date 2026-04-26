const http = require('http');

const PORT = 5000;

const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        const timestamp = new Date().toLocaleTimeString();
        
        if (req.url === '/api/vitals' && req.method === 'POST') {
            const data = JSON.parse(body);
            console.log(`[${timestamp}] 📡 RECEIVED VITALS: Patient ${data.patientId} - HR: ${data.heartRate}, SpO2: ${data.spo2}%`);
            res.writeHead(201);
            res.end(JSON.stringify({ status: 'success' }));
        } 
        else if (req.url === '/api/alerts' && req.method === 'POST') {
            const alert = JSON.parse(body);
            console.log(`[${timestamp}] 🚨 RECEIVED ALERT: [${alert.severity}] ${alert.alertType} for Patient ${alert.patientId}`);
            res.writeHead(201);
            res.end(JSON.stringify({ status: 'success' }));
        } 
        else {
            res.writeHead(404);
            res.end();
        }
    });
});

server.listen(PORT, () => {
    console.log(`\x1b[32m%s\x1b[0m`, `🚀 Mock Backend running at http://localhost:${PORT}`);
    console.log(`Waiting for simulator data...\n`);
});
