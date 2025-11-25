const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы
app.use(express.static(path.join(__dirname)));

// WebSocket сервер
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'join') {
                // Отправляем подтверждение обратно
                ws.send(JSON.stringify({
                    type: 'joined',
                    name: data.name
                }));
                
                // Рассылаем всем клиентам
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'joined', 
                            name: data.name
                        }));
                    }
                });
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'student.html'));
});

app.get('/screen', (req, res) => {
    res.sendFile(path.join(__dirname, 'screen.html'));
});
