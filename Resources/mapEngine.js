const mapEditorScreen = document.getElementById('map-editor-screen');
const mapMenuScreen = document.getElementById('map-menu-screen');
const mapEditorCanvas = document.getElementById('mapEditorCanvas');
const editorCtx = mapEditorCanvas.getContext('2d');
const mapListContainer = document.getElementById('map-list-container');
const playMapButton = document.getElementById('play-map-button');
const editMapButton = document.getElementById('edit-map-button');
const renameMapButton = document.getElementById('rename-map-button');
const deleteMapButton = document.getElementById('delete-map-button');
const copyMapButton = document.getElementById('copy-map-button');
const newMapButton = document.getElementById('new-map-button');
const mapMenuReturnButton = document.getElementById('map-menu-return-button');
const undoButton = document.getElementById('undo-button');
const redoButton = document.getElementById('redo-button');
const saveMapButton = document.getElementById('save-map-button');
const exitEditorButton = document.getElementById('exit-editor-button');
const blockSelectors = document.querySelectorAll('.block-preview');

const editorGridSize = 20;
const editorWorldWidth = 1600;
const editorWorldHeight = 1600;
const editorViewWidth = 400;
const editorViewHeight = 400;

mapEditorCanvas.width = editorViewWidth;
mapEditorCanvas.height = editorViewHeight;

let currentMap = {
    name: '',
    data: {},
    spawn: null
};
let selectedMapName = null;
let currentBlockType = 'obstacle';
let isDrawing = false;
let isErasing = false;
let history = [];
let historyIndex = -1;
let editorCamera = { x: 0, y: 0 };

const blockTypes = {
    'obstacle': { color: '#6c757d', code: 'X' },
    'spawn': { color: '#3498db', border: 'white', code: 'S' }
};

function getSavedMapsData() {
    try {
        return JSON.parse(localStorage.getItem('customMaps')) || {};
    } catch (e) {
        console.error("Error loading saved maps:", e);
        return {};
    }
}

function saveMap() {
    if (!currentMap.spawn) {
        alert('The map must have a spawn point in order to save it.');
        return;
    }
    const maps = getSavedMapsData();
    maps[currentMap.name] = currentMap;
    localStorage.setItem('customMaps', JSON.stringify(maps));
    alert('¡Map saved successfully!');
    renderMapList();
}

function getSavedMaps() {
    return Object.keys(getSavedMapsData());
}

function renderMapList() {
    mapListContainer.innerHTML = '';
    const maps = getSavedMaps();
    if (maps.length === 0) {
        mapListContainer.innerHTML = '<p style="color: #888;">There are no maps created :(</p>';
    }
    maps.forEach(mapName => {
        const mapEntry = document.createElement('div');
        mapEntry.className = 'map-entry';
        mapEntry.textContent = mapName;
        mapEntry.dataset.mapName = mapName;
        mapEntry.addEventListener('click', () => {
            selectedMapName = mapName;
            const allEntries = mapListContainer.querySelectorAll('.map-entry');
            allEntries.forEach(entry => entry.style.backgroundColor = 'transparent');
            mapEntry.style.backgroundColor = '#444';
            toggleMapButtons(true);
        });
        mapListContainer.appendChild(mapEntry);
    });
    selectedMapName = null;
    toggleMapButtons(false);
}

function toggleMapButtons(state) {
    if (playMapButton) playMapButton.disabled = !state;
    if (editMapButton) editMapButton.disabled = !state;
    if (renameMapButton) renameMapButton.disabled = !state;
    if (deleteMapButton) deleteMapButton.disabled = !state;
    if (copyMapButton) copyMapButton.disabled = !state;
}

function playSelectedMap() {
    if (selectedMapName) {
        showScreen(document.getElementById('player-game-screen'));
        startMapGame(selectedMapName);
    }
}

function editSelectedMap() {
    if (selectedMapName) {
        const maps = getSavedMapsData();
        const mapData = maps[selectedMapName];
        if (mapData) {
            currentMap = {
                name: mapData.name,
                data: {...mapData.data},
                spawn: mapData.spawn
            };
            history = [{ ...currentMap.data, spawn: currentMap.spawn }];
            historyIndex = 0;
            showScreen(mapEditorScreen);
            renderEditorCanvas();
        } else {
            alert('The map could not be loaded for editing.');
        }
    }
}

function renameSelectedMap() {
    if (selectedMapName) {
        const newName = prompt(`Renombrar el mapa '${selectedMapName}':`, selectedMapName);
        if (newName && newName.trim() !== '' && newName !== selectedMapName) {
            const maps = getSavedMapsData();
            if (maps[newName]) {
                alert('There is already a map with that name, choose another one');
                return;
            }
            const mapToRename = maps[selectedMapName];
            mapToRename.name = newName;
            delete maps[selectedMapName];
            maps[newName] = mapToRename;
            localStorage.setItem('customMaps', JSON.stringify(maps));
            renderMapList();
        }
    }
}

function deleteSelectedMap() {
    if (selectedMapName && confirm(`Are you sure you want to delete the map?'${selectedMapName}'?`)) {
        const maps = getSavedMapsData();
        delete maps[selectedMapName];
        localStorage.setItem('customMaps', JSON.stringify(maps));
        renderMapList();
    }
}

function copySelectedMap() {
    if (selectedMapName) {
        const newName = prompt(`Copiar el mapa '${selectedMapName}'. Enter the name of the map:`);
        if (newName && newName.trim() !== '') {
            const maps = getSavedMapsData();
            if (maps[newName]) {
                alert('There is already a map with that name, choose another one.');
                return;
            }
            const originalMap = maps[selectedMapName];
            const newMap = {
                name: newName.trim(),
                data: {...originalMap.data},
                spawn: originalMap.spawn
            };
            maps[newName] = newMap;
            localStorage.setItem('customMaps', JSON.stringify(maps));
            renderMapList();
        }
    }
}

function drawEditor() {
    editorCtx.clearRect(0, 0, mapEditorCanvas.width, mapEditorCanvas.height);
    
    editorCtx.strokeStyle = '#222';
    editorCtx.lineWidth = 1;
    for (let x = -editorCamera.x % editorGridSize; x < editorViewWidth; x += editorGridSize) {
        editorCtx.beginPath();
        editorCtx.moveTo(x, 0);
        editorCtx.lineTo(x, editorViewHeight);
        editorCtx.stroke();
    }
    for (let y = -editorCamera.y % editorGridSize; y < editorViewHeight; y += editorGridSize) {
        editorCtx.beginPath();
        editorCtx.moveTo(0, y);
        editorCtx.lineTo(editorViewWidth, y);
        editorCtx.stroke();
    }

    for (const key in currentMap.data) {
        const [x, y] = key.split('-').map(Number);
        const type = currentMap.data[key];
        const block = blockTypes[type];
        
        if (block) {
            const screenX = x - editorCamera.x;
            const screenY = y - editorCamera.y;
            if (screenX >= -editorGridSize && screenX < editorViewWidth && screenY >= -editorGridSize && screenY < editorViewHeight) {
                editorCtx.fillStyle = block.color;
                editorCtx.fillRect(screenX, screenY, editorGridSize, editorGridSize);
                if (block.border) {
                    editorCtx.strokeStyle = block.border;
                    editorCtx.strokeRect(screenX, screenY, editorGridSize, editorGridSize);
                }
            }
        }
    }
}

function renderEditorCanvas() {
    requestAnimationFrame(renderEditorCanvas);
    drawEditor();
}

function getGridPosition(e) {
    const rect = mapEditorCanvas.getBoundingClientRect();
    const scaleX = mapEditorCanvas.width / rect.width;
    const scaleY = mapEditorCanvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    const gridX = Math.floor((mouseX + editorCamera.x) / editorGridSize) * editorGridSize;
    const gridY = Math.floor((mouseY + editorCamera.y) / editorGridSize) * editorGridSize;
    return { x: gridX, y: gridY };
}

function placeOrEraseBlock(e) {
    if (!isDrawing && !isErasing) return;
    const pos = getGridPosition(e);
    const key = `${pos.x}-${pos.y}`;
    
    if (pos.x < 0 || pos.x >= editorWorldWidth || pos.y < 0 || pos.y >= editorWorldHeight) {
        return;
    }

    const previousState = { ...currentMap.data, spawn: currentMap.spawn };
    
    if (isErasing) {
        if (key in currentMap.data) {
            delete currentMap.data[key];
            if (currentMap.spawn === key) {
                currentMap.spawn = null;
            }
        }
    } else {
        if (currentBlockType === 'spawn') {
            if (currentMap.spawn && currentMap.spawn !== key) {
                delete currentMap.data[currentMap.spawn];
            }
            currentMap.data[key] = currentBlockType;
            currentMap.spawn = key;
        } else {
            currentMap.data[key] = currentBlockType;
        }
    }
    
    const currentState = { ...currentMap.data, spawn: currentMap.spawn };
    if (JSON.stringify(previousState) !== JSON.stringify(currentState)) {
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        history.push(currentState);
        historyIndex++;
    }
}

if (mapEditorCanvas) {
    mapEditorCanvas.addEventListener('contextmenu', e => e.preventDefault());
    mapEditorCanvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isDrawing = true;
            placeOrEraseBlock(e);
        } else if (e.button === 2) {
            isErasing = true;
            placeOrEraseBlock(e);
        }
    });
    mapEditorCanvas.addEventListener('mousemove', placeOrEraseBlock);
    mapEditorCanvas.addEventListener('mouseup', () => {
        isDrawing = false;
        isErasing = false;
    });
    mapEditorCanvas.addEventListener('mouseleave', () => {
        isDrawing = false;
        isErasing = false;
    });
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        const state = history[historyIndex];
        currentMap.data = { ...state };
        currentMap.spawn = state.spawn;
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        const state = history[historyIndex];
        currentMap.data = { ...state };
        currentMap.spawn = state.spawn;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof showScreen === 'undefined') {
        window.showScreen = (screen) => {
            document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
            screen.style.display = 'flex';
        };
    }
    showScreen(mapMenuScreen);
    renderMapList();
});

if (mapMenuReturnButton) {
    mapMenuReturnButton.addEventListener('click', () => {
        window.location.href = 'index.html'; 
    });
}

if (newMapButton) {
    newMapButton.addEventListener('click', () => {
        const mapName = prompt('Write the name of the new map:');
        if (mapName && mapName.trim() !== '') {
            currentMap.name = mapName.trim();
            currentMap.data = {};
            currentMap.spawn = null;
            history = [{ data: {}, spawn: null }];
            historyIndex = 0;
            showScreen(mapEditorScreen);
            renderEditorCanvas();
        }
    });
}

if (mapEditorCanvas) {
    mapEditorCanvas.addEventListener('contextmenu', e => e.preventDefault());
    mapEditorCanvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isDrawing = true;
            placeOrEraseBlock(e);
        } else if (e.button === 2) {
            isErasing = true;
            placeOrEraseBlock(e);
        }
    });
    mapEditorCanvas.addEventListener('mousemove', placeOrEraseBlock);
    mapEditorCanvas.addEventListener('mouseup', () => {
        isDrawing = false;
        isErasing = false;
    });
    mapEditorCanvas.addEventListener('mouseleave', () => {
        isDrawing = false;
        isErasing = false;
    });
}

document.addEventListener('keydown', e => {
    const moveSpeed = 40;
    switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            editorCamera.y = Math.max(0, editorCamera.y - moveSpeed);
            break;
        case 'arrowdown':
        case 's':
            editorCamera.y = Math.min(editorWorldHeight - editorViewHeight, editorCamera.y + moveSpeed);
            break;
        case 'arrowleft':
        case 'a':
            editorCamera.x = Math.max(0, editorCamera.x - moveSpeed);
            break;
        case 'arrowright':
        case 'd':
            editorCamera.x = Math.min(editorWorldWidth - editorViewWidth, editorCamera.x + moveSpeed);
            break;
    }
});

if (undoButton) undoButton.addEventListener('click', undo);
if (redoButton) redoButton.addEventListener('click', redo);
if (saveMapButton) saveMapButton.addEventListener('click', saveMap);

if (exitEditorButton) {
    exitEditorButton.addEventListener('click', () => {
        const currentState = { ...currentMap.data, spawn: currentMap.spawn };
        const initialMapState = history[0] || { data: {}, spawn: null };
        const isDirty = JSON.stringify(currentState) !== JSON.stringify(initialMapState);

        if (isDirty) {
            if (confirm('Are you sure you want to log ou t? Youll lose any unsaved changes!')) {
                showScreen(mapMenuScreen);
                renderMapList();
            }
        } else {
            showScreen(mapMenuScreen);
            renderMapList();
        }
    });
}

if (blockSelectors) {
    blockSelectors.forEach(selector => {
        selector.addEventListener('click', () => {
            currentBlockType = selector.dataset.blockType;
            blockSelectors.forEach(s => s.style.border = '2px solid #555');
            selector.style.border = '2px solid yellow';
            if (selector.dataset.blockType === 'spawn') {
                selector.style.border = '2px solid yellow';
            }
        });
        if (selector.dataset.blockType === 'obstacle') {
            selector.style.backgroundColor = blockTypes.obstacle.color;
            selector.style.border = '2px solid yellow';
        } else if (selector.dataset.blockType === 'spawn') {
            selector.style.backgroundColor = blockTypes.spawn.color;
        }
    });
}

if (playMapButton) playMapButton.addEventListener('click', playSelectedMap);
if (editMapButton) editMapButton.addEventListener('click', editSelectedMap);
if (renameMapButton) renameMapButton.addEventListener('click', renameSelectedMap);
if (deleteMapButton) deleteMapButton.addEventListener('click', deleteSelectedMap);
if (copyMapButton) copyMapButton.addEventListener('click', copySelectedMap);

let isDragging = false;
let startX, startY;

editorCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}, { passive: false });

editorCanvas.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const dx = currentX - startX;
    const dy = currentY - startY;

    camX -= dx;
    camY -= dy;

    startX = currentX;
    startY = currentY;

    drawMap();
}, { passive: false });

editorCanvas.addEventListener('touchend', () => {
    isDragging = false;
});