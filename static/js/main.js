// iPhone Simulator Pro v2.0 - Main JavaScript
const API_URL = window.location.origin + '/api';
const socket = io(window.location.origin);

// Состояние
let installedApps = [];
let currentBrightness = 75;
let currentVolume = 60;
let lockTouchStartY = 0;
let lockTouchCurrentY = 0;
let isUnlocking = false;
let calculatorCurrent = '';
let calculatorOperation = '';
let calculatorPrevious = '';
let cameraStream = null;
let currentCamera = 'environment';

// =========== ИНИЦИАЛИЗАЦИЯ ===========
document.addEventListener('DOMContentLoaded', function() {
    updateClock();
    setInterval(updateClock, 1000);
    updateWeather();
    setInterval(updateWeather, 600000); // Каждые 10 минут
    loadInstalledApps();
    setupSocketListeners();
    setupGestures();
    setupLockScreenSwipe();
    setupSpotlightSearch();

    // Применяем сохраненные настройки
    applyBrightness(currentBrightness);
    applyVolume(currentVolume);

    console.log('✅ iPhone Simulator Pro v2.0 готов');
});

function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('ru-RU', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });

    document.getElementById('currentTime').textContent = time;
    document.getElementById('currentDate').textContent = date;
    document.getElementById('statusTime').textContent = time;

    // Обновляем Dynamic Island
    const islandContent = document.getElementById('dynamicIslandContent');
    if (islandContent && !islandContent.dataset.manual) {
        islandContent.innerHTML = `<span class="island-icon">⏰</span><span class="island-text">${time}</span>`;
    }
}

async function updateWeather() {
    try {
        // Пытаемся получить реальную погоду
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=61.25&longitude=73.42&current_weather=true`);
        const data = await response.json();

        if (data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            const icon = getWeatherIcon(code);

            document.getElementById('lockWeatherIcon').textContent = icon;
            document.getElementById('lockWeatherTemp').textContent = `${temp}°C в Сургуте`;
        }
    } catch (error) {
        // Если не удалось, показываем примерные данные
        console.log('Используем локальные данные погоды');
        document.getElementById('lockWeatherIcon').textContent = '🌤️';
        document.getElementById('lockWeatherTemp').textContent = '2°C в Сургуте';
    }
}

function getWeatherIcon(code) {
    if (code <= 3) return '☀️';
    if (code <= 48) return '🌫️';
    if (code <= 57) return '🌧️';
    if (code <= 67) return '🌨️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧️';
    return '⛈️';
}

// =========== ЭКРАН БЛОКИРОВКИ ===========
// Найдите и замените эти функции в main.js

// =========== ЭКРАН БЛОКИРОВКИ (ПОЛНОСТЬЮ ЗАМЕНИТЬ) ===========
function setupLockScreenSwipe() {
    const lockScreen = document.getElementById('lockScreen');
    const swipeIndicator = document.getElementById('swipeIndicator');
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    
    // Для касаний
    lockScreen.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        isDragging = true;
        lockScreen.style.transition = 'none';
        e.preventDefault();
    });
    
    lockScreen.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const diff = startY - currentY;
        
        if (diff > 0) {
            lockScreen.style.transform = `translateY(-${diff}px)`;
            lockScreen.style.opacity = Math.max(0, 1 - (diff / 400));
        }
        e.preventDefault();
    });
    
    lockScreen.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;
        lockScreen.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        
        const diff = startY - currentY;
        
        if (diff > 100) {
            // Разблокировка
            unlockScreen();
        } else {
            // Возврат
            lockScreen.style.transform = 'translateY(0)';
            lockScreen.style.opacity = '1';
        }
    });
    
    // Для мыши (компьютер)
    lockScreen.addEventListener('mousedown', function(e) {
        startY = e.clientY;
        isDragging = true;
        lockScreen.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        currentY = e.clientY;
        const diff = startY - currentY;
        
        if (diff > 0) {
            lockScreen.style.transform = `translateY(-${diff}px)`;
            lockScreen.style.opacity = Math.max(0, 1 - (diff / 400));
        }
    });
    
    document.addEventListener('mouseup', function(e) {
        if (!isDragging) return;
        isDragging = false;
        lockScreen.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        
        const diff = startY - currentY;
        
        if (diff > 100) {
            unlockScreen();
        } else {
            lockScreen.style.transform = 'translateY(0)';
            lockScreen.style.opacity = '1';
        }
    });
    
    // Добавляем подсказку для пользователя
    swipeIndicator.style.cursor = 'pointer';
    swipeIndicator.title = 'Смахните вверх для разблокировки';
}

// =========== ЖЕСТЫ ДЛЯ ШТОРОК (ПОЛНОСТЬЮ ЗАМЕНИТЬ) ===========
function setupGestures() {
    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;

    // Отслеживаем начало касания на главном экране
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
    });

    document.addEventListener('touchend', function(e) {
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const diffY = touchEndY - touchStartY;
        const diffX = touchEndX - touchStartX;
        const diffTime = Date.now() - touchStartTime;

        // Проверяем, что это быстрый свайп (меньше 300мс)
        if (diffTime > 500) return;

        // Свайп вниз от верхней части экрана
        if (touchStartY < 80 && diffY > 30 && Math.abs(diffX) < 50) {
            e.preventDefault();
            
            if (touchStartX < window.innerWidth / 2) {
                // Левая сторона - уведомления
                toggleNotificationCenter();
            } else {
                // Правая сторона - пункт управления
                toggleControlCenter();
            }
        }
        
        // Свайп вверх от нижней части для закрытия
        if (touchStartY > window.innerHeight - 100 && diffY < -30) {
            closeAllOverlays();
        }
    });
    
    // Для мыши
    document.addEventListener('mousedown', function(e) {
        touchStartY = e.clientY;
        touchStartX = e.clientX;
        touchStartTime = Date.now();
    });
    
    document.addEventListener('mouseup', function(e) {
        const diffY = e.clientY - touchStartY;
        const diffX = e.clientX - touchStartX;
        const diffTime = Date.now() - touchStartTime;
        
        if (diffTime > 500) return;
        
        if (touchStartY < 80 && diffY > 30 && Math.abs(diffX) < 50) {
            if (touchStartX < window.innerWidth / 2) {
                toggleNotificationCenter();
            } else {
                toggleControlCenter();
            }
        }
        
        if (touchStartY > window.innerHeight - 100 && diffY < -30) {
            closeAllOverlays();
        }
    });
}

// Функции для открытия/закрытия шторок
function toggleNotificationCenter() {
    const nc = document.getElementById('notificationCenter');
    const cc = document.getElementById('controlCenter');
    
    // Закрываем пункт управления если открыт
    if (cc.classList.contains('active')) {
        cc.classList.remove('active');
    }
    
    nc.classList.toggle('active');
}

function toggleControlCenter() {
    const nc = document.getElementById('notificationCenter');
    const cc = document.getElementById('controlCenter');
    
    // Закрываем уведомления если открыты
    if (nc.classList.contains('active')) {
        nc.classList.remove('active');
    }
    
    cc.classList.toggle('active');
}

function closeAllOverlays() {
    document.getElementById('notificationCenter').classList.remove('active');
    document.getElementById('controlCenter').classList.remove('active');
    document.getElementById('spotlightSearch').classList.remove('active');
}

// =========== SPOTLIGHT SEARCH (ЗАМЕНИТЬ) ===========
function setupSpotlightSearch() {
    const homeScreen = document.getElementById('homeScreen');
    let touchStartY = 0;
    let touchStartTime = 0;
    
    homeScreen.addEventListener('touchstart', function(e) {
        // Не активируем если нажали на иконку
        if (e.target.closest('.app-icon') || e.target.closest('.dock')) return;
        
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    });
    
    homeScreen.addEventListener('touchend', function(e) {
        if (e.target.closest('.app-icon') || e.target.closest('.dock')) return;
        
        const touchEndY = e.changedTouches[0].clientY;
        const diffY = touchEndY - touchStartY;
        const diffTime = Date.now() - touchStartTime;
        
        // Свайп вниз для поиска (от верхней части экрана)
        if (touchStartY < 200 && diffY > 30 && diffTime < 300) {
            toggleSpotlight();
        }
    });
    
    // Для мыши
    homeScreen.addEventListener('mousedown', function(e) {
        if (e.target.closest('.app-icon') || e.target.closest('.dock')) return;
        touchStartY = e.clientY;
        touchStartTime = Date.now();
    });
    
    homeScreen.addEventListener('mouseup', function(e) {
        if (e.target.closest('.app-icon') || e.target.closest('.dock')) return;
        
        const diffY = e.clientY - touchStartY;
        const diffTime = Date.now() - touchStartTime;
        
        if (touchStartY < 200 && diffY > 30 && diffTime < 300) {
            toggleSpotlight();
        }
    });
}

// =========== ИНИЦИАЛИЗАЦИЯ (ДОПОЛНИТЬ) ===========
document.addEventListener('DOMContentLoaded', function() {
    updateClock();
    setInterval(updateClock, 1000);
    updateWeather();
    setInterval(updateWeather, 600000);
    loadInstalledApps();
    setupSocketListeners();
    setupGestures();
    setupLockScreenSwipe();
    setupSpotlightSearch();
    
    // Применяем сохраненные настройки
    applyBrightness(currentBrightness);
    applyVolume(currentVolume);
    
    // Добавляем кнопки для тестирования на компьютере
    addTestButtons();
    
    console.log('✅ iPhone Simulator Pro v2.0 готов');
});

// Функция для добавления тестовых кнопок (для компьютера)
function addTestButtons() {
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
    
    if (!isMobile) {
        // Создаем панель управления для ПК
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 10px;
            z-index: 10000;
            display: flex;
            gap: 10px;
            font-size: 12px;
        `;
        
        panel.innerHTML = `
            <button onclick="toggleNotificationCenter()" style="padding:5px 10px; background:#007AFF; color:white; border:none; border-radius:5px; cursor:pointer;">🔔 Уведомления</button>
            <button onclick="toggleControlCenter()" style="padding:5px 10px; background:#007AFF; color:white; border:none; border-radius:5px; cursor:pointer;">⚙️ Пункт управления</button>
            <button onclick="unlockScreenDirect()" style="padding:5px 10px; background:#34C759; color:white; border:none; border-radius:5px; cursor:pointer;">🔓 Разблокировать</button>
        `;
        
        document.body.appendChild(panel);
    }
}

// Прямая разблокировка для ПК
function unlockScreenDirect() {
    const lockScreen = document.getElementById('lockScreen');
    const homeScreen = document.getElementById('homeScreen');
    
    lockScreen.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    lockScreen.style.transform = 'translateY(-100%)';
    lockScreen.style.opacity = '0';
    
    setTimeout(() => {
        lockScreen.style.display = 'none';
        homeScreen.style.display = 'block';
        homeScreen.style.animation = 'fadeIn 0.3s ease';
    }, 500);
}

// =========== SPOTLIGHT SEARCH ===========
function setupSpotlightSearch() {
    const homeScreen = document.getElementById('homeScreen');
    let touchStartY = 0;
    let touchStartTime = 0;

    homeScreen.addEventListener('touchstart', function(e) {
        if (e.target.closest('.app-icon') || e.target.closest('.dock')) return;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    });

    homeScreen.addEventListener('touchend', function(e) {
        const touchEndY = e.changedTouches[0].clientY;
        const diffY = touchEndY - touchStartY;
        const diffTime = Date.now() - touchStartTime;

        // Свайп вниз для поиска
        if (diffY > 50 && diffTime < 300) {
            toggleSpotlight();
        }
    });
}

function toggleSpotlight() {
    const spotlight = document.getElementById('spotlightSearch');
    spotlight.classList.toggle('active');

    if (spotlight.classList.contains('active')) {
        document.getElementById('searchInput').focus();
    }
}

// =========== ЗАГРУЗКА ПРИЛОЖЕНИЙ ===========
async function loadInstalledApps() {
    try {
        const response = await fetch(`${API_URL}/apps/installed`);
        const apps = await response.json();
        installedApps = apps;
        renderApps(apps);
    } catch (error) {
        console.error('Ошибка загрузки приложений:', error);
    }
}

function renderApps(apps) {
    const appGrid = document.getElementById('appGrid');
    const dockBar = document.getElementById('dockBar');

    if (!appGrid || !dockBar) return;

    appGrid.innerHTML = '';
    dockBar.innerHTML = '';

    // Dock приложения
    const dockApps = ['phone', 'safari', 'messages', 'music'];

    apps.forEach(app => {
        const appElement = createAppElement(app);

        if (dockApps.includes(app.id)) {
            dockBar.appendChild(appElement.cloneNode(true));
        }

        appGrid.appendChild(appElement);
    });

    // Добавляем системные приложения
    const additionalApps = [
        { id: 'appstore', name: 'App Store', icon: '🏪', color: '#0A84FF', special: true },
        { id: 'files', name: 'Файлы', icon: '📁', color: '#34C759', special: true },
        { id: 'settings', name: 'Настройки', icon: '⚙️', color: '#8E8E93', special: true },
        { id: 'camera', name: 'Камера', icon: '📷', color: '#5856D6', special: true },
        { id: 'gallery', name: 'Фото', icon: '🖼️', color: '#FF9500', special: true },
        { id: 'calculator', name: 'Калькулятор', icon: '🧮', color: '#FF9F0A', special: true },
        { id: 'chat', name: 'AI Чат', icon: '💬', color: '#FF2D55', special: true },
        { id: 'weather', name: 'Погода', icon: '🌤️', color: '#4facfe', special: true },
        { id: 'maps', name: 'Карты', icon: '🗺️', color: '#34C759', special: true },
        { id: 'clock', name: 'Часы', icon: '⏰', color: '#FF9500', special: true },
    ];

    additionalApps.forEach(app => {
        const appElement = createSpecialAppElement(app);
        appGrid.appendChild(appElement);
    });
}

function createAppElement(app) {
    const div = document.createElement('div');
    div.className = 'app-icon';
    div.innerHTML = `
        <div class="icon-image" style="background: linear-gradient(135deg, ${app.color || '#666'}, ${app.color || '#444'});">
            ${app.icon}
        </div>
        <div class="app-name">${app.name}</div>
    `;

    div.onclick = () => openApp(app.id);

    // Долгое нажатие
    let longPress;
    div.addEventListener('touchstart', function(e) {
        longPress = setTimeout(() => {
            if (!app.system) {
                showContextMenu(e, app);
            }
        }, 500);
        e.preventDefault();
    });

    div.addEventListener('touchend', () => clearTimeout(longPress));
    div.addEventListener('touchmove', () => clearTimeout(longPress));

    // Правый клик
    div.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (!app.system) {
            showContextMenu(e, app);
        }
    });

    return div;
}

function createSpecialAppElement(app) {
    const div = document.createElement('div');
    div.className = 'app-icon';
    div.innerHTML = `
        <div class="icon-image" style="background: linear-gradient(135deg, ${app.color}, ${app.color});">
            ${app.icon}
        </div>
        <div class="app-name">${app.name}</div>
    `;

    div.onclick = () => {
        switch(app.id) {
            case 'appstore': openAppStore(); break;
            case 'files': openFiles(); break;
            case 'settings': openSettings(); break;
            case 'camera': openCamera(); break;
            case 'gallery': openGallery(); break;
            case 'calculator': openCalculator(); break;
            case 'chat': openChat(); break;
            case 'weather': openWeatherApp(); break;
            case 'maps': openMaps(); break;
            case 'clock': openClock(); break;
        }
    };

    return div;
}

// =========== ОТКРЫТИЕ ПРИЛОЖЕНИЙ ===========
function openApp(appId) {
    switch(appId) {
        case 'calculator':
            openCalculator();
            break;
        case 'messages':
            openMessages();
            break;
        case 'music':
            openMusic();
            break;
        case 'camera':
            openCamera();
            break;
        case 'phone':
            alert('📞 Приложение "Телефон"');
            break;
        case 'safari':
            alert('🌐 Safari браузер');
            break;
        case 'weather':
            openWeatherApp();
            break;
        case 'notes':
            alert('📝 Заметки');
            break;
        default:
            alert(`Открываем приложение: ${appId}`);
    }
}

function showContextMenu(event, app) {
    // Удаляем предыдущие меню
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-item delete" onclick="uninstallApp('${app.id}')">
            <span>🗑️</span>
            <span>Удалить "${app.name}"</span>
        </div>
        <div class="context-item" onclick="this.parentElement.remove()">
            <span>✕</span>
            <span>Отмена</span>
        </div>
    `;

    const x = event.clientX || (event.touches && event.touches[0].clientX) || 100;
    const y = event.clientY || (event.touches && event.touches[0].clientY) || 200;

    menu.style.left = `${Math.min(x, window.innerWidth - 220)}px`;
    menu.style.top = `${y}px`;

    document.body.appendChild(menu);

    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 100);
}

// =========== УСТАНОВКА/УДАЛЕНИЕ ===========
async function uninstallApp(appId) {
    if (confirm('Удалить это приложение?')) {
        try {
            const response = await fetch(`${API_URL}/apps/uninstall`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ app_id: appId })
            });

            const result = await response.json();
            alert(result.message);
            loadInstalledApps();
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }
}

// =========== APP STORE ===========
async function openAppStore() {
    document.getElementById('appStoreModal').classList.add('active');

    try {
        const response = await fetch(`${API_URL}/apps/store`);
        const apps = await response.json();
        renderAppStore(apps);
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function renderAppStore(apps) {
    const container = document.getElementById('appStoreContent');
    let html = '<div class="settings-section-title">Рекомендуемые приложения</div>';

    apps.forEach(app => {
        html += `
            <div style="display:flex; align-items:center; padding:15px; border-bottom:1px solid #f0f0f0;">
                <span style="font-size:40px; margin-right:15px;">${app.icon}</span>
                <div style="flex:1;">
                    <div style="font-weight:600;">${app.name}</div>
                    <div style="color:#666; font-size:12px;">${app.size} • ${app.category}</div>
                </div>
                <button onclick="installApp('${app.id}')" 
                    style="background:#0A84FF; color:white; border:none; border-radius:15px; padding:8px 20px; cursor:pointer;">
                    Установить
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function installApp(appId) {
    try {
        const response = await fetch(`${API_URL}/apps/install`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ app_id: appId })
        });

        const result = await response.json();
        alert(result.message);
        closeModal('appStoreModal');
        loadInstalledApps();
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// =========== КАМЕРА ===========
async function openCamera() {
    document.getElementById('cameraModal').classList.add('active');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: currentCamera } 
        });
        document.getElementById('cameraView').srcObject = cameraStream;
    } catch (error) {
        console.error('Ошибка камеры:', error);
        alert('Не удалось получить доступ к камере');
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraView');
    const canvas = document.getElementById('photoCanvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Конвертируем в blob и сохраняем
    canvas.toBlob(async function(blob) {
        const formData = new FormData();
        formData.append('file', blob, `photo_${Date.now()}.jpg`);
        formData.append('type', 'photo');

        try {
            const response = await fetch(`${API_URL}/files/upload`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Эффект вспышки
                flashScreen();
                alert('📸 Фото сохранено в галерею');
            }
        } catch (error) {
            console.error('Ошибка сохранения фото:', error);
        }
    }, 'image/jpeg', 0.95);
}

function flashScreen() {
    const screen = document.getElementById('mainScreen');
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 9999;
        transition: opacity 0.3s;
        border-radius: 38px;
    `;

    screen.appendChild(flash);

    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 300);
    }, 100);
}

function switchCamera() {
    currentCamera = currentCamera === 'environment' ? 'user' : 'environment';

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }

    openCamera();
}

function openGallery() {
    closeModal('cameraModal');
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('galleryModal').classList.add('active');
    loadGallery();
}

async function loadGallery() {
    try {
        const response = await fetch(`${API_URL}/files/list?type=photo`);
        const photos = await response.json();
        renderGallery(photos);
    } catch (error) {
        console.error('Ошибка загрузки галереи:', error);
    }
}

function renderGallery(photos) {
    const grid = document.getElementById('galleryGrid');

    if (photos.length === 0) {
        grid.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">Нет фотографий</div>';
        return;
    }

    grid.innerHTML = photos.map(photo => `
        <div class="gallery-item">
            <img src="${API_URL}/files/download/${photo.id}" alt="photo">
        </div>
    `).join('');
}

// =========== КАЛЬКУЛЯТОР ===========
function openCalculator() {
    document.getElementById('calculatorModal').classList.add('active');
    resetCalculator();
}

function calcInput(value) {
    const display = document.getElementById('calcDisplay');

    if (value === 'C') {
        resetCalculator();
        return;
    }

    if (value === '±') {
        calculatorCurrent = (parseFloat(calculatorCurrent) * -1).toString();
        display.textContent = calculatorCurrent;
        return;
    }

    if (value === '%') {
        calculatorCurrent = (parseFloat(calculatorCurrent) / 100).toString();
        display.textContent = calculatorCurrent;
        return;
    }

    if (['+', '-', '×', '÷'].includes(value)) {
        if (calculatorCurrent === '' && calculatorPrevious === '') return;

        if (calculatorCurrent !== '') {
            calculatorPrevious = calculatorCurrent;
            calculatorOperation = value;
            calculatorCurrent = '';
        } else {
            calculatorOperation = value;
        }
        return;
    }

    if (calculatorCurrent.length >= 10) return;

    if (value === '.' && calculatorCurrent.includes('.')) return;

    calculatorCurrent += value;
    display.textContent = calculatorCurrent;
}

function calcCalculate() {
    if (calculatorCurrent === '' || calculatorPrevious === '' || calculatorOperation === '') return;

    const prev = parseFloat(calculatorPrevious);
    const curr = parseFloat(calculatorCurrent);
    let result = 0;

    switch (calculatorOperation) {
        case '+': result = prev + curr; break;
        case '-': result = prev - curr; break;
        case '×': result = prev * curr; break;
        case '÷': result = curr !== 0 ? prev / curr : 'Ошибка'; break;
    }

    document.getElementById('calcDisplay').textContent = result;
    calculatorCurrent = result.toString();
    calculatorPrevious = '';
    calculatorOperation = '';
}

function resetCalculator() {
    calculatorCurrent = '';
    calculatorPrevious = '';
    calculatorOperation = '';
    document.getElementById('calcDisplay').textContent = '0';
}

// =========== СООБЩЕНИЯ ===========
function openMessages() {
    document.getElementById('messagesModal').classList.add('active');
    renderMessages();
}

function renderMessages() {
    const chats = [
        { name: 'Анна', last: 'Привет! Как дела?', time: '12:30', avatar: '👩' },
        { name: 'Иван', last: 'Договорились на завтра', time: '11:15', avatar: '👨' },
        { name: 'Мама', last: 'Не забудь позвонить', time: 'Вчера', avatar: '👩‍👧' },
    ];

    const list = document.getElementById('messagesList');
    list.innerHTML = chats.map(chat => `
        <div class="msg-chat-item" onclick="openChatConversation('${chat.name}')">
            <div class="msg-avatar">${chat.avatar}</div>
            <div class="msg-preview">
                <div class="msg-name">${chat.name}</div>
                <div class="msg-last">${chat.last}</div>
            </div>
            <div style="color:#999; font-size:12px;">${chat.time}</div>
        </div>
    `).join('');
}

function openChatConversation(name) {
    alert(`💬 Открываем чат с ${name}`);
}

function newMessage() {
    alert('✏️ Новое сообщение');
}

// =========== МУЗЫКА ===========
function openMusic() {
    document.getElementById('musicModal').classList.add('active');
}

function playMusic(song) {
    const title = document.querySelector('.song-title');
    const artist = document.querySelector('.song-artist');
    const art = document.querySelector('.now-playing-art');

    if (song === 'Shape of You') {
        title.textContent = 'Shape of You';
        artist.textContent = 'Ed Sheeran';
        art.textContent = '🎵';
    } else if (song === 'Blinding Lights') {
        title.textContent = 'Blinding Lights';
        artist.textContent = 'The Weeknd';
        art.textContent = '🌟';
    } else if (song === 'Stay') {
        title.textContent = 'Stay';
        artist.textContent = 'Justin Bieber';
        art.textContent = '💫';
    }
}

// =========== ПОГОДА, КАРТЫ, ЧАСЫ ===========
async function openWeatherApp() {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=61.25&longitude=73.42&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Yekaterinburg`);
        const data = await response.json();

        let weatherHTML = '<div class="settings-section">';
        weatherHTML += '<div class="settings-section-title">Погода в Сургуте</div>';

        if (data.current_weather) {
            weatherHTML += `
                <div style="text-align:center; padding:20px;">
                    <div style="font-size:60px;">${getWeatherIcon(data.current_weather.weathercode)}</div>
                    <div style="font-size:48px; font-weight:300;">${Math.round(data.current_weather.temperature)}°C</div>
                    <div style="color:#666;">Скорость ветра: ${data.current_weather.windspeed} км/ч</div>
                </div>
            `;
        }

        weatherHTML += '</div>';

        const modal = document.createElement('div');
        modal.className = 'app-modal active';
        modal.innerHTML = `
            <div class="modal-header">
                <span class="modal-title">🌤️ Погода</span>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
            <div class="modal-content">${weatherHTML}</div>
        `;
        document.querySelector('.screen').appendChild(modal);

    } catch (error) {
        alert('🌤️ Погода в Сургуте: +2°C, переменная облачность');
    }
}

function openMaps() {
    alert('🗺️ Карты - Сургут
📍 61.25°N, 73.42°E
Текущее местоположение');
}

function openClock() {
    const now = new Date();
    alert(`⏰ Текущее время: ${now.toLocaleTimeString('ru-RU')}
📅 ${now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}`);
}

// =========== ФАЙЛЫ ===========
function openFiles() {
    document.getElementById('filesModal').classList.add('active');
    loadFiles();
}

async function uploadFile() {
    const fileInput = document.getElementById('fileUploadInput');
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/files/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        alert(result.message);
        loadFiles();
        fileInput.value = '';
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function loadFiles() {
    try {
        const response = await fetch(`${API_URL}/files/list`);
        const files = await response.json();
        renderFiles(files);
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function renderFiles(files) {
    const container = document.getElementById('filesList');

    if (files.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">Нет файлов</p>';
        return;
    }

    let html = '';
    files.forEach(file => {
        const isPhoto = file.name.match(/\.(jpg|jpeg|png|gif)$/i);
        html += `
            <div style="display:flex; align-items:center; padding:12px; border-bottom:1px solid #f0f0f0;">
                <span style="font-size:30px; margin-right:12px;">${isPhoto ? '🖼️' : '📄'}</span>
                <div style="flex:1;">
                    <div>${file.name}</div>
                    <div style="color:#999; font-size:11px;">${file.size_formatted || 'Неизвестно'}</div>
                </div>
                <a href="${API_URL}/files/download/${file.id}" download 
                   style="background:#34C759; color:white; padding:8px 15px; border-radius:15px; text-decoration:none; font-size:13px; margin-right:5px;">
                    ⬇️
                </a>
                <button onclick="deleteFile('${file.id}')" 
                    style="background:#FF3B30; color:white; border:none; border-radius:15px; padding:8px 15px; cursor:pointer;">
                    🗑️
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function deleteFile(fileId) {
    if (confirm('Удалить файл?')) {
        try {
            const response = await fetch(`${API_URL}/files/delete`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ file_id: fileId })
            });

            const result = await response.json();
            alert(result.message);
            loadFiles();
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }
}

function switchFileTab(tab) {
    document.querySelectorAll('.file-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    loadFiles();
}

// =========== НАСТРОЙКИ ===========
function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    loadSettings();
}

function loadSettings() {
    const container = document.getElementById('settingsContent');

    const html = `
        <div class="settings-section">
            <div class="settings-section-title">Apple ID</div>
            <div class="settings-item">
                <div class="settings-item-content">
                    <div class="settings-icon" style="background: #007AFF;">👤</div>
                    <div>
                        <div style="font-weight:500;">Пользователь iPhone</div>
                        <div style="font-size:12px; color:#666;">user@icloud.com</div>
                    </div>
                </div>
                <span class="settings-arrow">›</span>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">Основные</div>
            <div class="settings-item" onclick="toggleSetting('wifi')">
                <div class="settings-item-content">
                    <div class="settings-icon" style="background: #007AFF;">📶</div>
                    <div>Wi-Fi</div>
                </div>
                <span id="wifiStatus" style="color:#999; font-size:13px;">Подключено</span>
            </div>
            <div class="settings-item" onclick="toggleSetting('bluetooth')">
                <div class="settings-item-content">
                    <div class="settings-icon" style="background: #007AFF;">🔵</div>
                    <div>Bluetooth</div>
                </div>
                <span style="color:#999; font-size:13px;">Вкл</span>
            </div>
            <div class="settings-item">
                <div class="settings-item-content">
                    <div class="settings-icon" style="background: #34C759;">📱</div>
                    <div>Сотовые данные</div>
                </div>
                <span class="settings-arrow">›</span>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">Хранилище</div>
            <div class="settings-item">
                <div class="settings-item-content">
                    <div class="settings-icon" style="background: #FF9500;">💾</div>
                    <div>
                        <div>Хранилище iPhone</div>
                        <div style="font-size:12px; color:#666;">128 ГБ • Доступно 89.5 ГБ</div>
                    </div>
                </div>
                <span class="settings-arrow">›</span>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">Экран и яркость</div>
            <div class="settings-item">
                <div class="settings-item-content" style="flex-direction:column; width:100%;">
                    <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:10px;">
                        <span>Яркость</span>
                        <span>${currentBrightness}%</span>
                    </div>
                    <input type="range" min="0" max="100" value="${currentBrightness}" 
                        style="width:100%;" 
                        oninput="changeBrightness(this.value)">
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">Звуки</div>
            <div class="settings-item">
                <div class="settings-item-content" style="flex-direction:column; width:100%;">
                    <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:10px;">
                        <span>Громкость</span>
                        <span>${currentVolume}%</span>
                    </div>
                    <input type="range" min="0" max="100" value="${currentVolume}" 
                        style="width:100%;" 
                        oninput="changeVolume(this.value)">
                </div>
            </div>
        </div>

        <button onclick="resetSystem()" 
            style="width:100%; padding:15px; background:#FF3B30; color:white; border:none; border-radius:12px; margin-top:20px; cursor:pointer;">
            Сбросить все настройки
        </button>
    `;

    container.innerHTML = html;
}

function changeBrightness(value) {
    currentBrightness = value;
    applyBrightness(value);
}

function applyBrightness(value) {
    const screen = document.getElementById('mainScreen');
    const brightness = value / 100;
    screen.style.filter = `brightness(${0.4 + brightness * 0.6})`;
}

function changeVolume(value) {
    currentVolume = value;
    applyVolume(value);
    alert(`🔊 Громкость: ${value}%`);
}

function applyVolume(value) {
    // В реальном приложении здесь был бы контроль звука
    console.log(`Громкость установлена на ${value}%`);
}

function toggleFlashlight() {
    const screen = document.getElementById('mainScreen');
    screen.classList.toggle('flashlight-active');

    const icon = document.getElementById('flashlightIcon');
    if (screen.classList.contains('flashlight-active')) {
        icon.style.background = '#FFD60A';
        icon.style.color = '#000';
    } else {
        icon.style.background = 'rgba(255,255,255,0.15)';
        icon.style.color = 'white';
    }
}

async function toggleSetting(setting) {
    try {
        await fetch(`${API_URL}/settings/toggle`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ setting: setting })
        });

        // Обновляем иконки в пункте управления
        const icon = document.getElementById(`${setting}Icon`);
        const controlIcon = document.getElementById(`${setting}ControlIcon`);

        if (icon) icon.classList.toggle('active');

        if (setting === 'wifi') {
            document.getElementById('wifiIcon').classList.toggle('hidden');
        }

        alert(`✅ Настройка "${setting}" изменена`);
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function resetSystem() {
    if (confirm('ВНИМАНИЕ! Все данные будут удалены. Продолжить?')) {
        try {
            await fetch(`${API_URL}/system/reset`, { method: 'POST' });
            alert('Система сброшена');
            location.reload();
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }
}

function closeSettings() {
    closeModal('settingsModal');
}

// =========== AI ЧАТ ===========
function openChat() {
    document.getElementById('chatModal').classList.add('active');
}

function closeChat() {
    document.getElementById('chatModal').classList.remove('active');
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML += `<div class="ai-message user">${message}</div>`;

    input.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    socket.emit('send_message', { message: message });
}

// =========== УВЕДОМЛЕНИЯ ===========
async function clearNotifications() {
    try {
        await fetch(`${API_URL}/notifications/clear`, { method: 'POST' });
        document.getElementById('notificationsList').innerHTML = '<div class="no-notifications">Нет новых уведомлений</div>';
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// =========== WEB SOCKET ===========
function setupSocketListeners() {
    socket.on('receive_message', function(data) {
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv) {
            messagesDiv.innerHTML += `<div class="ai-message bot">${data.message}</div>`;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    });

    socket.on('notification', function(data) {
        const notifList = document.getElementById('notificationsList');
        if (notifList) {
            const noNotif = notifList.querySelector('.no-notifications');
            if (noNotif) noNotif.remove();

            notifList.insertAdjacentHTML('afterbegin', `
                <div style="background:rgba(255,255,255,0.1); padding:12px; border-radius:12px; margin-bottom:8px; color:white;">
                    <strong>${data.title}</strong>
                    <div style="font-size:12px; color:rgba(255,255,255,0.7);">${data.message}</div>
                </div>
            `);
        }
    });
}

// =========== ЖЕСТЫ ===========
function setupGestures() {
    let touchStartY = 0;
    let touchStartX = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const diffY = touchEndY - touchStartY;
        const diffX = touchEndX - touchStartX;

        // Свайп вниз от верха
        if (touchStartY < 100 && diffY > 50 && Math.abs(diffX) < 30) {
            if (touchStartX < window.innerWidth / 2) {
                document.getElementById('notificationCenter').classList.toggle('active');
            } else {
                document.getElementById('controlCenter').classList.toggle('active');
            }
        }

        // Свайп вверх снизу для закрытия
        if (touchStartY > window.innerHeight - 100 && diffY < -50) {
            document.getElementById('notificationCenter').classList.remove('active');
            document.getElementById('controlCenter').classList.remove('active');
        }
    });
}

// =========== МОДАЛЬНЫЕ ОКНА ===========
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');

    // Очистка камеры при закрытии
    if (modalId === 'cameraModal' && cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }

    // Очистка калькулятора
    if (modalId === 'calculatorModal') {
        resetCalculator();
    }
}

// Обработка клавиши Escape для закрытия модальных окон
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.app-modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        }
        document.getElementById('notificationCenter').classList.remove('active');
        document.getElementById('controlCenter').classList.remove('active');
    }
});

// Предотвращение стандартного поведения для блокировки на iOS
document.addEventListener('touchmove', function(e) {
    if (e.target.closest('.modal-content') || e.target.closest('.ai-messages')) {
        return;
    }
    e.preventDefault();
}, { passive: false });

console.log('✅ iPhone Simulator Pro v2.0 готов к использованию');