// Главная страница - специфичная логика

document.addEventListener('DOMContentLoaded', function() {
    initializeMainPage();
});

function initializeMainPage() {
    setupGallery();
    setupRoomBooking();
    setupNavigation();
    setupProfileIcon();
}

function setupGallery() {
    const track = document.querySelector('.gallery-track');
    const prevBtn = document.querySelector('.gallery-btn.prev');
    const nextBtn = document.querySelector('.gallery-btn.next');
    const images = document.querySelectorAll('.gallery-track img');
    
    if (!track || !prevBtn || !nextBtn) return;
    
    let currentIndex = 0;
    const imageCount = images.length;
    
    function updateGallery() {
        const translateX = -currentIndex * 100;
        track.style.transform = `translateX(${translateX}%)`;
    }
    
    prevBtn.addEventListener('click', function() {
        currentIndex = (currentIndex - 1 + imageCount) % imageCount;
        updateGallery();
    });
    
    nextBtn.addEventListener('click', function() {
        currentIndex = (currentIndex + 1) % imageCount;
        updateGallery();
    });
    
    // Автопрокрутка галереи
    let autoScroll = setInterval(() => {
        currentIndex = (currentIndex + 1) % imageCount;
        updateGallery();
    }, 5000);
    
    // Останавливаем автопрокрутку при наведении
    track.addEventListener('mouseenter', () => clearInterval(autoScroll));
    track.addEventListener('mouseleave', () => {
        autoScroll = setInterval(() => {
            currentIndex = (currentIndex + 1) % imageCount;
            updateGallery();
        }, 5000);
    });
}

function setupRoomBooking() {
    const bookNowBtn = document.getElementById('bookNowBtn');
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', function() {
            window.location.href = 'booking/booking.html';
        });
    }
    
    // Загрузка номеров на главной странице
    loadRoomsForHomepage();
}

async function loadRoomsForHomepage() {
    try {
        const response = await fetch('api/BookingManager.php?action=get_all_rooms');
        const result = await response.json();
        
        if (result.success && result.room_types) {
            displayRoomsOnHomepage(result.room_types);
        }
    } catch (error) {
        console.error('Error loading rooms for homepage:', error);
    }
}

function displayRoomsOnHomepage(rooms) {
    const roomsContainer = document.querySelector('.rooms-container');
    if (!roomsContainer) return;
    
    roomsContainer.innerHTML = rooms.map(room => `
        <div class="room-card">
            <img src="${getRoomImage(room.id)}" alt="${room.name}">
            <div class="room-info">
                <h3>${room.name}</h3>
                <p>${formatCurrency(room.price_per_night)} / ночь</p>
                <p class="room-description">${getRoomDescription(room.id)}</p>
                <button class="book-btn" onclick="redirectToBooking(${room.id})">Забронировать</button>
            </div>
        </div>
    `).join('');
}

function getRoomImage(roomId) {
    const roomImages = {
        1: 'assets/images/standart_solo/bed.jpg',
        2: 'assets/images/standart_duo/bed.jpg',
        3: 'assets/images/lux_solo/bed.jpg',
        4: 'assets/images/lux_duo/bed.jpeg',
        5: 'assets/images/romantic/bed.jpg'
    };
    return roomImages[roomId] || 'assets/images/default-room.jpg';
}

function getRoomDescription(roomId) {
    const descriptions = {
        1: 'Уютный одноместный номер с всеми удобствами',
        2: 'Просторный двухместный номер для комфортного отдыха',
        3: 'Роскошный одноместный номер с улучшенной отделкой',
        4: 'Просторный двухместный люкс с дополнительными услугами',
        5: 'Романтический номер для особых occasions'
    };
    return descriptions[roomId] || 'Комфортабельный номер для отдыха';
}

function formatCurrency(amount) {
    return parseFloat(amount).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' руб.';
}

function redirectToBooking(roomId) {
    window.location.href = `booking/booking.html?room=${roomId}`;
}

function setupNavigation() {
    // Плавная прокрутка к якорям
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function setupProfileIcon() {
    const profileIcon = document.getElementById('profileIcon');
    if (profileIcon) {
        profileIcon.addEventListener('click', function() {
            const loggedIn = localStorage.getItem('loggedIn') === 'true';
            if (loggedIn) {
                window.location.href = 'profile/profile.html';
            } else {
                window.location.href = './auth/login.html';
            }
        });
    }
}