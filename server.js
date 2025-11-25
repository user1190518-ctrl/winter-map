const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Обслуживание статических файлов из папки public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Явные маршруты для HTML страниц
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/screen', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screen.html'));
});

// Fallback для прямых запросов к HTML файлам
app.get('*.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', req.path));
});

// Запуск HTTP сервера
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
    console.log(`🌐 Student page: https://winter-map.onrender.com/`);
    console.log(`📺 Screen page: https://winter-map.onrender.com/screen`);
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

process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
