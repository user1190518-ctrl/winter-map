const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Основные маршруты
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/screen', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screen.html'));
});

// Health check для Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', time: new Date().toISOString() });
});

// Запуск сервера
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server started on port ${PORT}`);
});

// Простой WebSocket
const wss = new WebSocket.Server({ 
    server: server,
    path: '/ws'
});

wss.on('connection', (ws) => {
    console.log('🔗 New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'join') {
                // Отправляем подтверждение обратно
                ws.send(JSON.stringify({
                    type: 'ack',
                    name: data.name
                }));
                
                // Рассылаем всем остальным клиентам
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'joined',
                            name: data.name,
                            color: data.color || '#000000'
                        }));
                    }
                });
                
                console.log(`✅ Processed join for: ${data.name}`);
            }
        } catch (error) {
            console.error('❌ Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔌 Client disconnected');
    });
});

console.log('🚀 WebSocket server setup complete');
