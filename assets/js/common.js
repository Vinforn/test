// Общие функции для всего проекта

// Проверка авторизации через сервер
async function checkAuth() {
    try {
        const response = await fetch('/api/AuthManager.php?action=check_auth', {
            method: 'GET',
            credentials: 'include'
        });
        const result = await response.json();
        return result.success && result.user;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Перенаправление на страницу входа если не авторизован
async function requireAuth(redirectUrl = "./auth/login.html") {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// Форматирование даты
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return 'Некорректная дата';
    }
}

// Форматирование даты и времени
function formatDateTime(dateTimeString) {
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Некорректная дата';
    }
}

// Форматирование валюты
function formatCurrency(amount) {
    try {
        return parseFloat(amount).toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (e) {
        return '0.00';
    }
}

// Расчет количества ночей
function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Показать/скрыть сообщение
function showMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.textContent = message;
    element.style.display = 'block';
    
    const styles = {
        success: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
        error: { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
        info: { background: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' },
        warning: { background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' }
    };
    
    const style = styles[type] || styles.info;
    Object.assign(element.style, style);
    
    // Автоматическое скрытие
    if (type !== 'error') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Валидация email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Валидация телефона
function isValidPhone(phone) {
    // Простая валидация для российских номеров
    const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
    const cleanedPhone = phone.replace(/\s|\-|\(|\)/g, '');
    return cleanedPhone.length >= 10 && cleanedPhone.length <= 15;
}

// API запрос с обработкой ошибок
async function apiRequest(endpoint, data = null, method = 'POST') {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(endpoint, options);
        
        // Проверяем, что ответ - JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Получение данных пользователя с сервера
async function getUserData() {
    try {
        const response = await fetch('/api/AuthManager.php?action=check_auth', {
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success && result.user) {
            return result.user;
        }
        return null;
    } catch (error) {
        console.error('Get user data error:', error);
        return null;
    }
}

// Выход пользователя
async function logout() {
    try {
        const response = await fetch('/api/AuthManager.php?action=logout', {
            method: 'POST',
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

// Инициализация профиля на странице
function initializeProfile() {
    const profileIcon = document.getElementById('profileIcon');
    if (profileIcon) {
        profileIcon.addEventListener('click', async function(e) {
            e.preventDefault();
            const isAuthenticated = await checkAuth();
            if (isAuthenticated) {
                window.location.href = './profile/profile.html';
            } else {
                window.location.href = './auth/login.html';
            }
        });
    }
}

// Документ готов
document.addEventListener('DOMContentLoaded', function() {
    initializeProfile();
});