(function(){
  const url = (location.protocol === 'https:' ? 'wss':'ws') + '://' + location.host + '/ws';
  let ws;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  
  let isConnected = false;
  const statusElement = document.getElementById('status');
  const sendButton = document.getElementById('send');
  const inputContainer = document.getElementById('inputContainer');
  const nameInput = document.getElementById('name');

  function connectWebSocket() {
    ws = new WebSocket(url);
    
    ws.addEventListener('open', () => {
        console.log('✅ WebSocket connected');
        isConnected = true;
        reconnectAttempts = 0;
        updateStatus('✓ Подключено к серверу', true);
        sendButton.disabled = false;
        sendButton.textContent = '✨ Привет!';
    });

    ws.addEventListener('error', (error) => {
        console.error('❌ WebSocket error:', error);
        updateStatus('✗ Ошибка подключения', false);
        sendButton.disabled = true;
        sendButton.textContent = 'Подключение...';
    });

    ws.addEventListener('close', () => {
        console.log('🔌 WebSocket disconnected');
        isConnected = false;
        updateStatus('✗ Соединение разорвано', false);
        sendButton.disabled = true;
        sendButton.textContent = 'Подключение...';
        
        // Автоматическое переподключение
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
            updateStatus(`⟳ Переподключение... (${reconnectAttempts}/${maxReconnectAttempts})`, false);
            setTimeout(connectWebSocket, 2000);
        }
    });

    ws.addEventListener('message', (ev) => {
        try {
            console.log('📨 Received message:', ev.data);
            const msg = JSON.parse(ev.data);
            
            if (msg.type === 'ack') {
                const g = document.getElementById('greeting');
                g.style.display = 'block';
                g.innerHTML = "Добро пожаловать, " + escapeHtml(msg.name) + "!";
                console.log('✅ Welcome message shown for:', msg.name);
                
                // Скрываем поле ввода и кнопку после успешной отправки
                hideInputField();
            } else if (msg.type === 'connected') {
                console.log('✅ Server confirmed connection');
            }
        } catch(e) {
            console.error('❌ Error parsing message:', e);
        }
    });
  }

  function escapeHtml(s) {
      return s.replace(/[&<>"']/g, c => ({
          '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
      }[c]));
  }

  function updateStatus(message, isSuccess) {
      statusElement.textContent = message;
      statusElement.className = 'status ' + (isSuccess ? 'connected' : 'disconnected');
  }

  function hideInputField() {
      inputContainer.classList.add('hidden');
      sendButton.classList.add('hidden');
  }

  // Обработчик кнопки
  sendButton.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) {
          alert("Пожалуйста, введите ваше имя");
          return;
      }
      
      if (!isConnected || ws.readyState !== WebSocket.OPEN) {
          alert('Нет подключения к серверу. Пожалуйста, подождите или обновите страницу.');
          return;
      }
      
      const color = '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
      const message = { type: 'join', name, color };
      
      console.log('📤 Sending message:', message);
      ws.send(JSON.stringify(message));
      
      // Временно блокируем кнопку чтобы избежать спама
      sendButton.disabled = true;
      sendButton.textContent = 'Отправляется...';
      
      setTimeout(() => {
          if (isConnected) {
              sendButton.disabled = false;
              sendButton.textContent = '✨ Привет!';
          }
      }, 2000);
  });

  // Обработчик нажатия Enter в поле ввода
  nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
          sendButton.click();
      }
  });

  // Начинаем подключение
  connectWebSocket();

  // Показываем статус подключения
  updateStatus('⌛ Подключение к серверу...', false);
  sendButton.disabled = true;
  sendButton.textContent = 'Подключение...';

})();
