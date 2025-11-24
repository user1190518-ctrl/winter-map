// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

app.use(express.static(path.join(__dirname, 'public')));

let clients = new Map(); // id -> {ws, name, color}

// Broadcast utility
function broadcast(obj, exceptId = null) {
  const msg = JSON.stringify(obj);
  for (const [id, info] of clients.entries()) {
    if (id === exceptId) continue;
    if (info.ws.readyState === WebSocket.OPEN) {
      info.ws.send(msg);
    }
  }
}

wss.on('connection', (ws, req) => {
  const id = uuidv4();
  clients.set(id, { ws, name: null, color: null });

  // Send back assigned id (optional)
  ws.send(JSON.stringify({ type: 'connected', id }));

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      console.warn('Invalid JSON', data.toString());
      return;
    }

    if (msg.type === 'join') {
      // sanitize minimal
      const name = String(msg.name || 'Гость').slice(0, 40);
      const color = msg.color || '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
      const timestamp = Date.now();
      clients.set(id, { ws, name, color });

      const payload = {
        type: 'joined',
        id,
        name,
        color,
        timestamp
      };
      broadcast(payload); // inform all (including screens, other students)
      // also reply to sender with ack
      ws.send(JSON.stringify({ type: 'ack', id, name, color }));
    }

    if (msg.type === 'request_list') {
      // send current participants
      const list = [];
      for (const [cid, info] of clients.entries()) {
        if (info.name) list.push({ id: cid, name: info.name, color: info.color });
      }
      ws.send(JSON.stringify({ type: 'list', list }));
    }
  });

  ws.on('close', () => {
    const info = clients.get(id);
    clients.delete(id);
    if (info && info.name) {
      broadcast({ type: 'left', id, name: info.name });
    }
  });

  ws.on('error', () => {
    clients.delete(id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
