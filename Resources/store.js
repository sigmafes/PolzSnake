const storeScreen = document.getElementById('store-screen');
const returnButton = document.getElementById('return-button');
const coinsElement = document.getElementById('coins');
const storeCoinsElement = document.getElementById('store-coins');
const shopSkinsContainer = document.getElementById('shop-skins-container');
const mainScreen = document.getElementById('main-menu');

const skinsData = [
    { name: 'Default', price: 0, color: 'lime', id: 'default', type: 'single-color' },
    { name: 'Pastel', price: 1000, color: ['#a9d6e5', '#f1faee'], id: 'skin-1', type: 'two-color' },
    { name: 'Cyberpunk', price: 2000, color: { fill: 'black', border: '#3498db' }, id: 'skin-2', type: 'bordered' },
    { name: 'Sunset', price: 3000, color: { start: '#f39c12', end: '#e67e22' }, id: 'skin-3', type: 'gradient' },
    { name: 'Ember', price: 4000, color: { a: '#ff4136', b: '#222' }, id: 'skin-4', type: 'animated' },
    { name: 'Rainbow', price: 5000, color: null, id: 'skin-5', type: 'rgb' }
];

let playerCoins = Number(localStorage.getItem('playerCoins')) || 0;
let unlockedSkins = JSON.parse(localStorage.getItem('unlockedSkins')) || ['default'];
let currentSkinId = localStorage.getItem('currentSkinId') || 'default';

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
        skinCard.dataset.skinId = skin.id;

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
        } else if (skin.type === 'animated' || skin.type === 'rgb') {
            skinCard.style.backgroundImage = 'none';
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
        if (typeof renderSkinsSelector !== 'undefined') {
            renderSkinsSelector();
        }
        alert(`¡Skin ${skin.name} comprada!`);
    } else {
        alert('No tienes suficientes monedas para comprar este skin.');
    }
}

returnButton.addEventListener('click', () => {
    storeScreen.style.display = 'none';
    mainScreen.style.display = 'flex';
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderShopSkins);
} else {
    renderShopSkins();
}