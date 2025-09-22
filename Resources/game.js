const canvas = document.getElementById('juegoCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('puntaje');
const highscoreElement = document.getElementById('highscore');
const coinsElement = document.getElementById('coins');
const mainScreen = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const storeScreen = document.getElementById('store-screen');
const playButton = document.getElementById('play-button');
const shopButton = document.getElementById('shop-button');
const returnButton = document.getElementById('return-button');
const skinSelectorContainer = document.getElementById('skin-selector');
const storeCoinsElement = document.getElementById('store-coins');
const shopSkinsContainer = document.getElementById('shop-skins-container');

const gridSize = 20;
const worldWidth = 1600;
const worldHeight = 1600;
const numFoods = 30;

let snake, foods, direction, score, gameInterval;
let isPaused = false;
let highscore = localStorage.getItem('snakeHighscore') || 0;
let isSpeedBoosted = false;
let dx, dy;

const skinsData = [
    { name: 'Default', price: 0, color: 'lime', id: 'default', type: 'single-color' },
    { name: 'Pastel', price: 1000, color: ['#a9d6e5', '#f1faee'], id: 'skin-1', type: 'two-color' },
    { name: 'Cyberpunk', price: 2000, color: { fill: 'black', border: '#3498db' }, id: 'skin-2', type: 'bordered' },
    { name: 'Sunset', price: 3000, color: { start: '#ffff00', end: '#ff4d00' }, id: 'skin-3', type: 'gradient' },
    { name: 'Ember', price: 4000, color: { a: '#ff0000', b: '#000000' }, id: 'skin-4', type: 'animated' },
    { name: 'Rainbow', price: 5000, color: null, id: 'skin-5', type: 'rgb' }
];

let playerCoins = Number(localStorage.getItem('playerCoins')) || 0;
let unlockedSkins = JSON.parse(localStorage.getItem('unlockedSkins')) || ['default'];
let currentSkinId = localStorage.getItem('currentSkinId') || 'default';

highscoreElement.textContent = highscore;
coinsElement.textContent = playerCoins;

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    screen.style.display = 'flex';
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

function renderSkinsSelector() {
    skinSelectorContainer.innerHTML = '';
    skinsData.forEach(skin => {
        const skinSquare = document.createElement('div');
        skinSquare.className = 'skin-square';
        skinSquare.dataset.skinId = skin.id;

        const isUnlocked = unlockedSkins.includes(skin.id);

        if (skin.type === 'single-color') {
            skinSquare.style.backgroundColor = skin.color;
        } else if (skin.type === 'two-color') {
            skinSquare.style.backgroundImage = `linear-gradient(to bottom right, ${skin.color[0]}, ${skin.color[1]})`;
        } else if (skin.type === 'bordered') {
            skinSquare.style.backgroundColor = skin.color.fill;
            skinSquare.style.border = `2px solid ${skin.color.border}`;
        } else if (skin.type === 'gradient') {
            skinSquare.style.backgroundImage = `linear-gradient(to right, ${skin.color.start}, ${skin.color.end})`;
        } else if (skin.type === 'animated') {
            skinSquare.style.backgroundColor = skin.color.a;
        } else if (skin.type === 'rgb') {
            skinSquare.style.background = `linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)`;
        }

        if (!isUnlocked) {
            skinSquare.classList.add('locked');
            skinSquare.innerHTML = '<span class="locked-icon">🔒</span>';
        }
        
        if (skin.id === currentSkinId) {
            skinSquare.style.outline = '2px solid yellow';
            skinSquare.style.outlineOffset = '-2px';
        } else {
            skinSquare.style.outline = 'none';
        }

        skinSquare.addEventListener('click', () => {
            if (isUnlocked) {
                currentSkinId = skin.id;
                localStorage.setItem('currentSkinId', currentSkinId);
                renderSkinsSelector();
            }
        });

        skinSelectorContainer.appendChild(skinSquare);
    });
}

function updateCoinsDisplay() {
    playerCoins = Number(localStorage.getItem('playerCoins')) || 0;
    coinsElement.textContent = playerCoins;
    storeCoinsElement.textContent = playerCoins;
}

function renderShopSkins() {
    shopSkinsContainer.innerHTML = '';
    skinsData.forEach(skin => {
        const skinCard = document.createElement('div');
        skinCard.className = 'shop-skin-card';

        const isUnlocked = unlockedSkins.includes(skin.id);
        
        if (skin.type === 'single-color') {
            skinCard.style.backgroundColor = skin.color;
        } else if (skin.type === 'two-color') {
            skinCard.style.backgroundImage = `linear-gradient(to bottom right, ${skin.color[0]}, ${skin.color[1]})`;
        } else if (skin.type === 'bordered') {
            skinCard.style.backgroundColor = skin.color.fill;
            skinCard.style.border = `2px solid ${skin.color.border}`;
        } else if (skin.type === 'gradient') {
            skinCard.style.backgroundImage = `linear-gradient(to right, ${skin.color.start}, ${skin.color.end})`;
        } else if (skin.type === 'animated') {
            skinCard.style.backgroundColor = skin.color.a;
        } else if (skin.type === 'rgb') {
            skinCard.style.background = `linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)`;
        }

        if (!isUnlocked) {
            const priceTag = document.createElement('span');
            priceTag.className = 'price-tag';
            priceTag.textContent = `${skin.price} Coins`;
            skinCard.appendChild(priceTag);

            const buyButton = document.createElement('button');
            buyButton.className = 'buy-button';
            buyButton.textContent = 'Buy';
            buyButton.onclick = () => buySkin(skin);
            skinCard.appendChild(buyButton);
        } else {
            const unlockedText = document.createElement('span');
            unlockedText.className = 'unlocked-text';
            unlockedText.textContent = 'Unlocked';
            skinCard.appendChild(unlockedText);
        }

        shopSkinsContainer.appendChild(skinCard);
    });
}

function buySkin(skin) {
    if (playerCoins >= skin.price) {
        playerCoins -= skin.price;
        unlockedSkins.push(skin.id);
        localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
        localStorage.setItem('playerCoins', playerCoins);
        updateCoinsDisplay();
        renderShopSkins();
        renderSkinsSelector();
        alert(`¡Skin ${skin.name} comprada!`);
    } else {
        alert('No tienes suficientes monedas para comprar este skin.');
    }
}

function getRandomPosition() {
    let newPos;
    let overlap;
    do {
        overlap = false;
        newPos = {
            x: Math.floor(Math.random() * (worldWidth / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (worldHeight / gridSize)) * gridSize
        };
        for (const food of foods) {
            if (food.x === newPos.x && food.y === newPos.y) {
                overlap = true;
                break;
            }
        }
        for (const segment of snake) {
            if (segment.x === newPos.x && segment.y === newPos.y) {
                overlap = true;
                break;
            }
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

function draw() {
    const head = snake[0];
    const camX = head.x - canvas.width / 2;
    const camY = head.y - canvas.height / 2;
    const skin = getSkinData();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let x = -camX % gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = -camY % gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    if (skin.type === 'two-color') {
        snake.forEach((segment, index) => {
            ctx.fillStyle = (index % 2 === 0) ? skin.color[0] : skin.color[1];
            ctx.fillRect(segment.x - camX, segment.y - camY, gridSize, gridSize);
        });
    } else if (skin.type === 'bordered') {
        snake.forEach(segment => {
            ctx.fillStyle = skin.color.fill;
            ctx.fillRect(segment.x - camX, segment.y - camY, gridSize, gridSize);
            ctx.strokeStyle = skin.color.border;
            ctx.lineWidth = 2;
            ctx.strokeRect(segment.x - camX, segment.y - camY, gridSize, gridSize);
        });
    } else if (skin.type === 'gradient') {
        const startColor = hexToRgb(skin.color.start);
        const endColor = hexToRgb(skin.color.end);
        snake.forEach((segment, index) => {
            const t = index / (snake.length > 1 ? snake.length - 1 : 1);
            const r = Math.round(startColor.r + (endColor.r - startColor.r) * t);
            const g = Math.round(startColor.g + (endColor.g - startColor.g) * t);
            const b = Math.round(startColor.b + (endColor.b - startColor.b) * t);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(segment.x - camX, segment.y - camY, gridSize, gridSize);
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
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        snake.forEach(segment => ctx.fillRect(segment.x - camX, segment.y - camY, gridSize, gridSize));
    } else if (skin.type === 'rgb') {
        snake.forEach((segment, index) => {
            const t = (Date.now() / 1000 + index / snake.length) % 1;
            ctx.fillStyle = `hsl(${t * 360}, 100%, 50%)`;
            ctx.fillRect(segment.x - camX, segment.y - camY, gridSize, gridSize);
        });
    } else {
        ctx.fillStyle = skin.color;
        snake.forEach(segment => ctx.fillRect(segment.x - camX, segment.y - camY, gridSize, gridSize));
    }

    foods.forEach(food => {
        if (food.type === 'red') ctx.fillStyle = 'red';
        else if (food.type === 'blue') ctx.fillStyle = 'blue';
        else if (food.type === 'yellow') ctx.fillStyle = 'yellow';
        ctx.fillRect(food.x - camX, food.y - camY, gridSize, gridSize);
    });

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.strokeRect(0 - camX, 0 - camY, worldWidth, worldHeight);
    scoreElement.textContent = score;
    coinsElement.textContent = playerCoins;
    if (isPaused) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

function checkCollision() {
    const head = snake[0];
    const gridX = Math.round(head.x / gridSize) * gridSize;
    const gridY = Math.round(head.y / gridSize) * gridSize;
    if (gridX < 0 || gridX >= worldWidth || gridY < 0 || gridY >= worldHeight) return true;
    for (let i = 1; i < snake.length; i++) {
        if (gridX === snake[i].x && gridY === snake[i].y) return true;
    }
    return false;
}

function mainLoop() {
    if (isPaused) return;
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    const foodIndex = foods.findIndex(food => Math.round(head.x / gridSize) * gridSize === food.x && Math.round(head.y / gridSize) * gridSize === food.y);
    if (foodIndex !== -1) {
        const eatenFood = foods[foodIndex];
        playerCoins += 1;
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
        if (score > highscore) {
            highscore = score;
            localStorage.setItem('snakeHighscore', highscore);
            highscoreElement.textContent = highscore;
        }
        foods.splice(foodIndex, 1);
        foods.push(generateFood());
    } else {
        snake.pop();
    }
    if (checkCollision()) {
        alert('Game Over! Your score is: ' + score);
        clearInterval(gameInterval);
        showScreen(mainScreen);
        return;
    }
    draw();
}

function startGame() {
    showScreen(gameScreen);
    snake = [{ x: worldWidth / 2, y: worldHeight / 2 }];
    direction = 'right';
    dx = gridSize;
    dy = 0;
    score = 0;
    generateFoods();
    gameInterval = setInterval(mainLoop, 80);
}

document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            if (direction !== 'down') { direction = 'up'; dx = 0; dy = -gridSize; } break;
        case 'ArrowDown':
        case 's':
            if (direction !== 'up') { direction = 'down'; dx = 0; dy = gridSize; } break;
        case 'ArrowLeft':
        case 'a':
            if (direction !== 'right') { direction = 'left'; dx = -gridSize; dy = 0; } break;
        case 'ArrowRight':
        case 'd':
            if (direction !== 'left') { direction = 'right'; dx = gridSize; dy = 0; } break;
        case ' ': isPaused = !isPaused; break;
    }
});

playButton.addEventListener('click', startGame);
shopButton.addEventListener('click', () => {
    showScreen(storeScreen);
    updateCoinsDisplay();
    renderShopSkins();
});
returnButton.addEventListener('click', () => showScreen(mainScreen));

renderSkinsSelector();
showScreen(mainScreen);

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, false);

canvas.addEventListener('touchend', (e) => {
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
}, false);