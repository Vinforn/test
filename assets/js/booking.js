// Логика для страниц бронирования

document.addEventListener('DOMContentLoaded', function() {
    initializeBookingPage();
});

function initializeBookingPage() {
    if (!requireAuth()) return;
    
    setupDateSelection();
    setupProfileData();
    setupBookingForm();
    
    // Загружаем все номера при загрузке страницы
    loadAllRooms();
}

function setupDateSelection() {
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    // Установка минимальной даты
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    checkInInput.min = today;
    checkOutInput.min = today;
    
    // Установка значений по умолчанию
    checkInInput.value = today;
    checkOutInput.value = tomorrowStr;
    
    // Обработчики изменения дат
    checkInInput.addEventListener('change', function() {
        checkOutInput.min = this.value;
        if (checkOutInput.value < this.value) {
            checkOutInput.value = this.value;
        }
        loadAvailableRooms();
    });
    
    checkOutInput.addEventListener('change', function() {
        loadAvailableRooms();
    });
}

function setupProfileData() {
    const userData = getUserData();
    
    // Основные данные
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    
    if (nameInput) {
        nameInput.value = userData.name || '';
    }
    if (phoneInput) phoneInput.value = userData.phone || '';
    if (emailInput) emailInput.value = userData.email || '';
    
    // Данные документа
    const documentTypeSelect = document.getElementById('documentType');
    const documentNumberInput = document.getElementById('documentNumber');
    const countrySelect = document.getElementById('country');
    
    if (documentTypeSelect && userData.documentType) {
        documentTypeSelect.value = userData.documentType;
    }
    if (documentNumberInput && userData.documentNumber) {
        documentNumberInput.value = userData.documentNumber;
    }
    if (countrySelect && userData.country) {
        countrySelect.value = userData.country;
    }
}

// Функция загрузки доступных номеров
async function loadAvailableRooms() {
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    
    if (!checkIn || !checkOut) {
        console.log('❌ Dates not selected yet');
        return;
    }
    
    if (new Date(checkOut) <= new Date(checkIn)) {
        console.log('❌ Invalid date range');
        return;
    }
    
    showRoomsLoading();
    
    try {
        const result = await apiRequest('booking/booking.php', {
            action: 'get_available_rooms',
            check_in: checkIn,
            check_out: checkOut
        });
        
        if (result.success) {
            displayAvailableRooms(result.available_rooms);
        } else {
            console.error('❌ Error loading available rooms:', result.message);
            // Загружаем все номера как fallback
            loadAllRooms();
        }
    } catch (error) {
        console.error('❌ Error loading available rooms:', error);
        loadAllRooms();
    }
}

// Функция загрузки всех номеров (без проверки доступности)
async function loadAllRooms() {
    showRoomsLoading();
    
    try {
        const result = await apiRequest('booking/booking.php', {
            action: 'get_all_rooms'
        });
        
        if (result.success) {
            displayAvailableRooms(result.room_types);
        } else {
            console.error('❌ Error loading all rooms:', result.message);
            showNoRoomsMessage();
        }
    } catch (error) {
        console.error('❌ Error loading all rooms:', error);
        showNoRoomsMessage();
    }
}

// Функция отображения доступных номеров
function displayAvailableRooms(rooms) {
    const roomsContainer = document.getElementById('roomsContainer');
    const roomsSection = document.getElementById('roomsSection');
    
    if (!roomsContainer || !roomsSection) return;
    
    hideRoomsLoading();
    
    if (!rooms || rooms.length === 0) {
        showNoRoomsMessage();
        return;
    }
    
    roomsContainer.innerHTML = rooms.map(room => createRoomCard(room)).join('');
    console.log(`✅ Displayed ${rooms.length} available rooms`);
    
    // Добавляем обработчики для кнопок бронирования
    setupBookingButtons();
    
    // Показываем секцию с номерами
    roomsSection.style.display = 'block';
}

// Функция создания карточки номера
function createRoomCard(room) {
    const imagePath = getRoomImage(room.id);
    const isAvailable = room.available_rooms !== undefined ? room.available_rooms > 0 : true;
    
    return `
    <div class="room-card ${!isAvailable ? 'room-unavailable' : ''}">
        <img src="${imagePath}" alt="${room.name}">
        <div class="room-info">
            <h3>${room.name}</h3>
            <p class="room-price">${formatCurrency(room.price_per_night)} руб. / ночь</p>
            ${room.available_rooms !== undefined ? `
                <p class="room-availability">Доступно номеров: ${room.available_rooms}</p>
            ` : ''}
            <p class="room-description">${getRoomDescription(room.id)}</p>
            <button class="book-btn book-room" 
                    data-room="${room.name}" 
                    data-price="${room.price_per_night}"
                    data-room-id="${room.id}"
                    ${!isAvailable ? 'disabled' : ''}>
                ${isAvailable ? 'Забронировать' : 'Недоступно'}
            </button>
        </div>
    </div>
    `;
}

function setupBookingButtons() {
    document.querySelectorAll(".book-room").forEach(button => {
        button.addEventListener("click", (e) => {
            if (button.disabled) return;
            
            const roomName = button.dataset.room;
            const roomPrice = button.dataset.price;
            const roomId = button.dataset.roomId;
            
            // Сохраняем выбранный номер
            localStorage.setItem("selectedRoom", JSON.stringify({
                name: roomName,
                price: roomPrice,
                id: roomId
            }));
            
            // Показываем форму бронирования
            showBookingForm(roomId, roomName);
        });
    });
}

function showBookingForm(roomId, roomName) {
    const bookingForm = document.getElementById('bookingForm');
    const roomsSection = document.getElementById('roomsSection');
    
    if (bookingForm && roomsSection) {
        // Заполняем выпадающий список типов номеров
        const roomTypeSelect = document.getElementById('roomType');
        roomTypeSelect.innerHTML = `<option value="${roomId}" selected>${roomName}</option>`;
        
        // Заполняем даты в форме
        document.getElementById('formCheckIn').value = document.getElementById('checkIn').value;
        document.getElementById('formCheckOut').value = document.getElementById('checkOut').value;
        
        // Показываем форму, скрываем список номеров
        bookingForm.style.display = 'block';
        roomsSection.style.display = 'none';
        
        // Прокручиваем к форме
        bookingForm.scrollIntoView({ behavior: 'smooth' });
        
        // Обновляем информацию об оплате
        updatePaymentSummary();
    }
}

function setupBookingForm() {
    const bookingForm = document.getElementById("bookingForm");
    if (!bookingForm) return;

    // Обработчик чекбокса оплаты
    const payNowCheckbox = document.getElementById('payNow');
    const paymentDetails = document.getElementById('paymentDetails');
    
    if (payNowCheckbox && paymentDetails) {
        payNowCheckbox.addEventListener('change', function() {
            if (this.checked) {
                paymentDetails.classList.add('active');
                updatePaymentSummary();
            } else {
                paymentDetails.classList.remove('active');
            }
        });
    }

    // Обработчики выбора способа оплаты
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Обновление суммы оплаты при изменении дат
    const updatePaymentElements = ['formCheckIn', 'formCheckOut'];
    updatePaymentElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updatePaymentSummary);
        }
    });

    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const roomTypeSelect = document.getElementById("roomType");
        const roomTypeValue = roomTypeSelect.value;
        
        if (!roomTypeValue) {
            alert("Пожалуйста, выберите тип номера");
            return;
        }

        const formData = {
            room_type_id: roomTypeValue,
            check_in: document.getElementById("formCheckIn").value,
            check_out: document.getElementById("formCheckOut").value,
            guests_count: parseInt(document.getElementById("guests").value),
            payment_method_id: getSelectedPaymentMethod()
        };
        
        // Валидация дат
        if (new Date(formData.check_out) <= new Date(formData.check_in)) {
            alert("Дата выезда должна быть позже даты заезда");
            return;
        }
        
        // Сохраняем данные документа в профиль
        const documentType = document.getElementById('documentType').value;
        const documentNumber = document.getElementById('documentNumber').value;
        const country = document.getElementById('country').value;
        
        localStorage.setItem('userDocumentType', documentType);
        localStorage.setItem('userDocumentNumber', documentNumber);
        localStorage.setItem('userCountry', country);

        const payNow = document.getElementById('payNow') ? document.getElementById('payNow').checked : false;

        try {
            // Отправляем бронирование в БД
            const result = await submitBookingToDB(formData);
            
            if (result.success) {
                // Сохраняем ID бронирования для возможной оплаты
                localStorage.setItem('currentBookingId', result.booking_id);
                
                if (payNow && formData.payment_method_id) {
                    // Переходим на страницу оплаты
                    window.location.href = 'payment.html';
                } else {
                    showSuccessMessage();
                }
            } else {
                alert("Ошибка бронирования: " + result.message);
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert("Ошибка при создании бронирования");
        }
    });

    // Обработчик кнопки "Забронировать еще"
    const continueBtn = document.getElementById('continueBooking');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            hideSuccessMessage();
            // Сбрасываем форму и показываем список номеров
            bookingForm.reset();
            bookingForm.style.display = 'none';
            document.getElementById('roomsSection').style.display = 'block';
            loadAvailableRooms();
        });
    }
}

function updatePaymentSummary() {
    const roomTypeSelect = document.getElementById('roomType');
    const checkIn = document.getElementById('formCheckIn');
    const checkOut = document.getElementById('formCheckOut');
    
    if (roomTypeSelect && roomTypeSelect.value && checkIn && checkIn.value && checkOut && checkOut.value) {
        const selectedOption = roomTypeSelect.options[roomTypeSelect.selectedIndex];
        const roomPrice = selectedOption.text.match(/(\d+)/)?.[0];
        
        if (roomPrice) {
            const nights = calculateNights(checkIn.value, checkOut.value);
            const totalAmount = parseFloat(roomPrice) * nights;
            
            const paymentNights = document.getElementById('paymentNights');
            const paymentAmount = document.getElementById('paymentAmount');
            
            if (paymentNights) paymentNights.textContent = nights;
            if (paymentAmount) paymentAmount.textContent = formatCurrency(totalAmount);
        }
    }
}

function getSelectedPaymentMethod() {
    const selectedMethod = document.querySelector('.payment-method.selected');
    return selectedMethod ? selectedMethod.dataset.method : null;
}

async function submitBookingToDB(bookingData) {
    return await apiRequest('booking/booking.php', {
        action: 'create_booking',
        ...bookingData
    });
}

function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    const bookingForm = document.getElementById('bookingForm');
    
    if (successMessage && bookingForm) {
        bookingForm.style.display = 'none';
        successMessage.style.display = 'block';
    }
}

function hideSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

function showRoomsLoading() {
    const roomsLoading = document.getElementById('roomsLoading');
    if (roomsLoading) {
        roomsLoading.style.display = 'block';
    }
}

function hideRoomsLoading() {
    const roomsLoading = document.getElementById('roomsLoading');
    if (roomsLoading) {
        roomsLoading.style.display = 'none';
    }
}

function showNoRoomsMessage() {
    const roomsContainer = document.getElementById('roomsContainer');
    if (roomsContainer) {
        roomsContainer.innerHTML = `
            <div class="no-rooms-message">
                <h3>😔 Нет доступных номеров на выбранные даты</h3>
                <p>Попробуйте изменить даты заезда и выезда</p>
            </div>
        `;
    }
    hideRoomsLoading();
}