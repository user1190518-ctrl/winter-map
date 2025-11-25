<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Экран приветствий</title>

<style>
    body {
        margin: 0;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: linear-gradient(180deg, 
            #2ecc71 0%, 
            #ffffff 50%, 
            #3498db 100%
        );
    }

    /* ────────────────────────────────
       ЛОГОТИПЫ (увеличенные)
       ──────────────────────────────── */
    .logo-left {
        position: fixed;
        left: 20px;
        top: 20px;
        width: 220px;
        opacity: 0.95;
        z-index: 10;
    }

    .logo-right {
        position: fixed;
        right: 20px;
        top: 20px;
        width: 180px;
        opacity: 0.95;
        z-index: 10;
    }

    /* ────────────────────────────────
       ЗАГОЛОВОК
       ──────────────────────────────── */
    .title {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 40px;
        font-weight: 800;
        color: #d63031;
        text-align: center;
        text-shadow: 0 3px 6px rgba(0,0,0,0.25);
        z-index: 5;
        width: 100%;
    }

    /* ────────────────────────────────
       КАРТА
       ──────────────────────────────── */
    .map {
        position: absolute;
        top: 57%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 78%;
        max-width: 1300px;
        opacity: 1;
        z-index: 1;
    }

    /* ────────────────────────────────
       ПУЗЫРЬКИ-ПРИВЕТСТВИЯ
       ──────────────────────────────── */
    .bubble {
        position: absolute;
        padding: 12px 20px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #1e3799;
        box-shadow: 0 6px 14px rgba(0,0,0,0.25);
        font-size: 22px;
        font-weight: 600;
        animation: bubbleIn 1s ease, floatUp 10s linear forwards;
        white-space: nowrap;
        pointer-events: none;
        z-index: 20;
    }

    @keyframes bubbleIn {
        0% { transform: scale(0.3); opacity: 0; }
        60% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); }
    }

    @keyframes floatUp {
        0% { transform: translateY(0); }
        100% { transform: translateY(-140px); opacity: 0; }
    }

    /* ────────────────────────────────
       СНЕЖИНКИ
       ──────────────────────────────── */
    .snowflake {
        position: fixed;
        top: -10px;
        color: white;
        font-size: 20px;
        opacity: 0.85;
        filter: drop-shadow(0 0 6px rgba(255,255,255,1));
        pointer-events: none;
        z-index: 2;
        animation-name: fall;
        animation-timing-function: linear;
    }

    @keyframes fall {
        0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 0.4;
        }
        100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 1;
        }
    }
</style>
</head>

<body>

<!-- ЛОГОТИПЫ -->
<img src="/logo2.png" class="logo-left">
<img src="/logo.png" class="logo-right">

<!-- ЗАГОЛОВОК -->
<div class="title">Школа русского языка и культуры России 2025</div>

<!-- КАРТА -->
<img src="/map.png" class="map">

<script>
/*** WebSocket: принимаем имена и создаём пузырьки ***/
(function(){

    const url = (location.protocol === 'https:' ? 'wss':'ws') + '://' + location.host + '/ws';
    const ws = new WebSocket(url);

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({
            '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
        }[c]));
    }

    ws.addEventListener('message', (ev) => {
        try {
            const msg = JSON.parse(ev.data);
            
            /* ←←← ВОТ ЗДЕСЬ ИСПРАВЛЕНО */
            if (msg.type === 'joined') {
                showBubble(msg.name);
            }

        } catch(e){}
    });

    function showBubble(name) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerHTML = "Добро пожаловать, " + escapeHtml(name) + "!";

        const map = document.querySelector('.map');
        const rect = map.getBoundingClientRect();

        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;

        bubble.style.left = x + "px";
        bubble.style.top = y + "px";

        document.body.appendChild(bubble);

        setTimeout(() => bubble.remove(), 10000);
    }
})();

/*** ❄ Создание 3D-снежинок ❄ ***/
(function createSnow() {
    const snowCount = 25;

    for (let i = 0; i < snowCount; i++) {
        const sn = document.createElement("div");
        sn.className = "snowflake";
        sn.innerHTML = "❄";

        const size = Math.random() * 22 + 10;
        const left = Math.random() * 100;
        const duration = Math.random() * 8 + 6;
        const delay = Math.random() * 5;

        sn.style.fontSize = size + "px";
        sn.style.left = left + "vw";
        sn.style.animationDuration = duration + "s";
        sn.style.animationDelay = delay + "s";

        document.body.appendChild(sn);
    }
})();
</script>

</body>
</html>
