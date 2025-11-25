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

// Запуск HTTP сервера
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
});

// WebSocket сервер
const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
});

// Хранилище подключений
const connections = {
    students: new Set(),
    screens: new Set()
};

wss.on('connection', (ws, req) => {
    console.log('🔗 New WebSocket connection');
    
    // Временное решение: считаем первыми подключившихся экранами, остальных - студентами
    // Это неидеально, но будет работать для демо
    const isScreen = connections.screens.size === 0;
    
    if (isScreen) {
        connections.screens.add(ws);
        console.log('📺 Screen connected');
    } else {
        connections.students.add(ws);
        console.log('👤 Student connected');
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('📨 Received:', data);
            
            if (data.type === 'join') {
                // Отправляем подтверждение студенту
                ws.send(JSON.stringify({
                    type: 'ack',
                    name: data.name
                }));
                
                // Рассылаем всем экранам
                connections.screens.forEach(screen => {
                    if (screen.readyState === WebSocket.OPEN && screen !== ws) {
                        screen.send(JSON.stringify({
                            type: 'joined', 
                            name: data.name,
                            color: data.color,
                            id: uuidv4()
                        }));
                        console.log(`📤 Sent to screen: ${data.name}`);
                    }
                });
                
                console.log(`🎉 Sent welcome for: ${data.name} to ${connections.screens.size} screens`);
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        if (connections.screens.has(ws)) {
            connections.screens.delete(ws);
            console.log('📺 Screen disconnected');
        } else {
            connections.students.delete(ws);
            console.log('👤 Student disconnected');
        }
        
        console.log(`📊 Remaining: ${connections.students.size} students, ${connections.screens.size} screens`);
    });

    ws.on('error', (error) => {
        console.error('💥 WebSocket error:', error);
    });
});

// Статистика
setInterval(() => {
    console.log(`📊 Connections: ${connections.students.size} students, ${connections.screens.size} screens`);
}, 30000);

process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
