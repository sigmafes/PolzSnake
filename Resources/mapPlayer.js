// --- Elementos del DOM para la pantalla de juego ---
const playerGameScreen = document.getElementById('player-game-screen');
const playerCanvas = document.getElementById('playerCanvas');
const playerCtx = playerCanvas.getContext('2d');
const playerPuntajeSpan = document.getElementById('player-puntaje');
const playerHighscoreSpan = document.getElementById('player-highscore');
const playerCoinsSpan = document.getElementById('player-coins');
const returnFromGameButton = document.getElementById('return-from-game');

const GRID_SIZE = 20;
const numFoods = 30;
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1600;

const playerViewWidth = 400;
const playerViewHeight = 400;
playerCanvas.width = playerViewWidth;
playerCanvas.height = playerViewHeight;

const zoomFactor = 1.3;
const zoomedGridSize = GRID_SIZE / zoomFactor;

let snake = [];
let foods = [];
let direction = 'right';
let dx = GRID_SIZE;
let dy = 0;
let score = 0;
let isPaused = false;
let highscore = localStorage.getItem('snakeHighscore') || 0;
let playerCoins = Number(localStorage.getItem('playerCoins')) || 0;
let gameInterval;
let obstacles = {};
let gameSpawn = null;
let currentSkinId = localStorage.getItem('currentSkinId') || 'default';

const skinsData = [
    { name: 'Default', price: 0, color: 'lime', id: 'default', type: 'single-color' },
    { name: 'Pastel', price: 1000, color: ['#a9d6e5', '#f1faee'], id: 'skin-1', type: 'two-color' },
    { name: 'Cyberpunk', price: 2000, color: { fill: 'black', border: '#3498db' }, id: 'skin-2', type: 'bordered' },
    { name: 'Sunset', price: 3000, color: { start: '#ffff00', end: '#ff4d00' }, id: 'skin-3', type: 'gradient' },
    { name: 'Ember', price: 4000, color: { a: '#ff0000', b: '#000000' }, id: 'skin-4', type: 'animated' },
    { name: 'Rainbow', price: 5000, color: null, id: 'skin-5', type: 'rgb' }
];

function updateUI() {
    playerPuntajeSpan.textContent = score;
    playerHighscoreSpan.textContent = highscore;
    playerCoinsSpan.textContent = playerCoins;
}

function getSkinData() {
    return skinsData.find(s => s.id === currentSkinId);
}

function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getRandomPosition() {
    let newPos;
    let overlap;
    do {
        overlap = false;
        newPos = {
            x: Math.floor(Math.random() * (WORLD_WIDTH / GRID_SIZE)) * GRID_SIZE,
            y: Math.floor(Math.random() * (WORLD_HEIGHT / GRID_SIZE)) * GRID_SIZE
        };
        for (const segment of snake) {
            if (segment.x === newPos.x && segment.y === newPos.y) {
                overlap = true;
                break;
            }
        }
        if (obstacles[`${newPos.x}-${newPos.y}`]) {
            overlap = true;
        }
    } while (overlap);
    return newPos;
}

function generateFood() {
    let type = 'red';
    const rand = Math.random();
    if (rand < 0.05) {
        type = 'yellow';
    } else if (rand < 0.15) {
        type = 'blue';
    }
    return { ...getRandomPosition(), type: type };
}

function generateFoods() {
    foods = [];
    for (let i = 0; i < numFoods; i++) {
        foods.push(generateFood());
    }
}

function checkCollision() {
    const head = snake[0];
    if (head.x < 0 || head.x >= WORLD_WIDTH || head.y < 0 || head.y >= WORLD_HEIGHT) return true;
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    if (obstacles[`${head.x}-${head.y}`]) return true;
    return false;
}

function mainLoop() {
    if (isPaused) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    const foodIndex = foods.findIndex(food => head.x === food.x && head.y === food.y);

    if (foodIndex !== -1) {
        const eatenFood = foods[foodIndex];
        if (eatenFood.type === 'blue') {
            score += 2;
        } else if (eatenFood.type === 'yellow') {
            score += 3;
            clearInterval(gameInterval);
            gameInterval = setInterval(mainLoop, 40);
            setTimeout(() => {
                clearInterval(gameInterval);
                gameInterval = setInterval(mainLoop, 80);
            }, 5000);
        } else {
            score++;
        }

        foods.splice(foodIndex, 1);
        foods.push(generateFood());
    } else {
        snake.pop();
    }

    if (checkCollision()) {
        alert('¡Game Over! Tu puntuación es: ' + score);
        clearInterval(gameInterval);
        showScreen(document.getElementById('map-menu-screen'));
        return;
    }

    draw();
}

function draw() {
    const head = snake[0];
    
    const camX = head.x - (playerViewWidth / 2) * zoomFactor;
    const camY = head.y - (playerViewHeight / 2) * zoomFactor;

    playerCtx.clearRect(0, 0, playerViewWidth, playerViewHeight);

    playerCtx.fillStyle = '#6c757d';
    for (const key in obstacles) {
        const [x, y] = key.split('-').map(Number);
        const screenX = (x - camX) / zoomFactor;
        const screenY = (y - camY) / zoomFactor;
        playerCtx.fillRect(screenX, screenY, zoomedGridSize, zoomedGridSize);
    }
    
    const skin = getSkinData();
    if (skin.type === 'two-color') {
        snake.forEach((segment, index) => {
            const screenX = (segment.x - camX) / zoomFactor;
            const screenY = (segment.y - camY) / zoomFactor;
            playerCtx.fillStyle = (index % 2 === 0) ? skin.color[0] : skin.color[1];
            playerCtx.fillRect(screenX, screenY, zoomedGridSize, zoomedGridSize);
        });
    } else if (skin.type === 'bordered') {
        snake.forEach(segment => {
            const screenX = (segment.x - camX) / zoomFactor;
            const screenY = (segment.y - camY) / zoomFactor;
            playerCtx.fillStyle = skin.color.fill;
            playerCtx.fillRect(screenX, screenY, zoomedGridSize, zoomedGridSize);
            playerCtx.strokeStyle = skin.color.border;
            playerCtx.lineWidth = 2;
            playerCtx.strokeRect(screenX, screenY, zoomedGridSize, zoomedGridSize);
        });
    }

    else if (skin.type === 'gradient') {
        const startColor = hexToRgb(skin.color.start);
        const endColor = hexToRgb(skin.color.end);
        snake.forEach((segment, index) => {
            const screenX = (segment.x - camX) / zoomFactor;
            const screenY = (segment.y - camY) / zoomFactor;
            const t = index / (snake.length > 1 ? snake.length - 1 : 1);
            const r = Math.round(startColor.r + (endColor.r - startColor.r) * t);
            const g = Math.round(startColor.g + (endColor.g - startColor.g) * t);
            const b = Math.round(startColor.b + (endColor.b - startColor.b) * t);
            playerCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            playerCtx.fillRect(screenX, screenY, zoomedGridSize, zoomedGridSize);
        });
    } else if (skin.type === 'animated') {
        const time = Date.now() / 1000;
        const cycleDuration = 2;
        const t = (Math.sin(time * Math.PI / cycleDuration) + 1) / 2;
        const colorA = hexToRgb(skin.color.a);
        const colorB = hexToRgb(skin.color.b);
        const r = Math.round(colorA.r + (colorB.r - colorA.r) * t);
        const g = Math.round(colorA.g + (colorB.g - colorA.g) * t);
        const b = Math.round(colorA.b + (colorB.b - colorA.b) * t);
        playerCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        snake.forEach(segment => {
            const screenX = (segment.x - camX) / zoomFactor;
            const screenY = (segment.y - camY) / zoomFactor;
            playerCtx.fillRect(screenX, screenY, zoomedGridSize, zoomedGridSize);
        });
    } else if (skin.type === 'rgb') {
        snake.forEach((segment, index) => {
            const screenX = (segment.x - camX) / zoomFactor;
            const screenY = (segment.y - camY) / zoomFactor;
            const t = (Date.now() / 1000 + index / snake.length) % 1;
            playerCtx.fillStyle = `hsl(${t * 360}, 100%, 50%)`;
            playerCtx.fillRect(screenX, screenY, zoomedGridSize, zoomedGridSize);
        });
    } else {
        snake.forEach(segment => {
            const screenX = (segment.x - camX) / zoomFactor;
            const screenY = (segment.y - camY) / zoomFactor;
            playerCtx.fillStyle = skin.color;
            playerCtx.fillRect(screenX, screenY, zoomedGridSize, zoomedGridSize);
        });
    }

    foods.forEach(food => {
        const screenX = (food.x - camX) / zoomFactor;
        const screenY = (food.y - camY) / zoomFactor;
        if (food.type === 'red') playerCtx.fillStyle = 'red';
        else if (food.type === 'blue') playerCtx.fillStyle = 'blue';
        else if (food.type === 'yellow') playerCtx.fillStyle = 'yellow';
        playerCtx.fillRect(screenX, screenY, zoomedGridSize, zoomedGridSize);
    });

    updateUI();
    
    playerCtx.strokeStyle = '#555';
    playerCtx.lineWidth = 4 / zoomFactor;
    const screenWorldX = (0 - camX) / zoomFactor;
    const screenWorldY = (0 - camY) / zoomFactor;
    const screenWorldWidth = WORLD_WIDTH / zoomFactor;
    const screenWorldHeight = WORLD_HEIGHT / zoomFactor;
    playerCtx.strokeRect(screenWorldX, screenWorldY, screenWorldWidth, screenWorldHeight);

    if (isPaused) {
        playerCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        playerCtx.font = '30px Arial';
        playerCtx.textAlign = 'center';
        playerCtx.fillText('PAUSED', playerViewWidth / 2, playerViewHeight / 2);
    }
}

function startMapGame(mapName) {
    const maps = JSON.parse(localStorage.getItem('customMaps'));
    const mapData = maps[mapName];
    if (mapData) {
        obstacles = {};
        for (const key in mapData.data) {
            const [x, y] = key.split('-').map(Number);
            if (mapData.data[key] === 'obstacle') {
                obstacles[`${x}-${y}`] = true;
            }
        }
        
        if (mapData.spawn) {
            const [x, y] = mapData.spawn.split('-').map(Number);
            gameSpawn = { x, y };
        } else {
            gameSpawn = { x: 0, y: 0 };
        }
        
        snake = [{ x: gameSpawn.x, y: gameSpawn.y }];
        score = 0;
        direction = 'right';
        dx = GRID_SIZE;
        dy = 0;
        isPaused = false;
        generateFoods();
        clearInterval(gameInterval);
        gameInterval = setInterval(mainLoop, 80);
        draw();
    } else {
        alert("El mapa seleccionado no existe.");
    }
}

document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            if (direction !== 'down') { direction = 'up'; dx = 0; dy = -GRID_SIZE; } break;
        case 'ArrowDown':
        case 's':
            if (direction !== 'up') { direction = 'down'; dx = 0; dy = GRID_SIZE; } break;
        case 'ArrowLeft':
        case 'a':
            if (direction !== 'right') { direction = 'left'; dx = -GRID_SIZE; dy = 0; } break;
        case 'ArrowRight':
        case 'd':
            if (direction !== 'left') { direction = 'right'; dx = GRID_SIZE; dy = 0; } break;
        case ' ':
            isPaused = !isPaused;
            if (!isPaused) {
                mainLoop();
            }
            break;
    }
});

if (returnFromGameButton) {
    returnFromGameButton.addEventListener('click', () => {
        clearInterval(gameInterval);
        showScreen(document.getElementById('map-menu-screen'));
    });
}

let touchStartX = 0;
let touchStartY = 0;

playerCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

playerCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction !== 'left') {
            direction = 'right';
        } else if (dx < 0 && direction !== 'right') {
            direction = 'left';
        }
    } else {
        if (dy > 0 && direction !== 'up') {
            direction = 'down';
        } else if (dy < 0 && direction !== 'down') {
            direction = 'up';
        }
    }
}, { passive: false });