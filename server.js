const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Обслуживание статических файлов
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'student.html'));
});

app.get('/screen', (req, res) => {
    res.sendFile(path.join(__dirname, 'screen.html'));
});

// Запуск HTTP сервера
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
});

// WebSocket сервер
const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
});

wss.on('connection', (ws) => {
    console.log('🔗 New WebSocket connection');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('📨 Received:', data);
            
            if (data.type === 'join') {
                // Отправляем подтверждение обратно отправителю
                ws.send(JSON.stringify({
                    type: 'ack',
                    name: data.name,
                    color: data.color
                }));
                
                // Рассылаем всем клиентам на экране
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'joined', 
                            name: data.name,
                            color: data.color,
                            id: uuidv4()
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔌 Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('💥 WebSocket error:', error);
    });
});

// Обработка graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
