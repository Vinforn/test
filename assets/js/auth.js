// Логика для страниц аутентификации

document.addEventListener('DOMContentLoaded', function() {
    initializeAuthPages();
});

function initializeAuthPages() {
    setupLoginForm();
    setupRegisterForm();
}

// Настройка формы входа
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        
        // Базовая валидация
        if (!phone || !password) {
            showMessage('loginMessage', 'Пожалуйста, заполните все поля', 'error');
            return;
        }
        
        if (!isValidPhone(phone)) {
            alert("не првильный номер");
            showMessage('loginMessage', 'Пожалуйста, введите корректный номер телефона', 'error');
            return;
        }
        
        try {
            const result = await apiRequest('auth.php', {
                action: 'login',
                phone: phone,
                password: password
            });
            
            if (result.success) {
                showMessage('loginMessage', 'Успешный вход! Вы будете перенаправлены...', 'success');
                
                // Перенаправляем на главную страницу
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } else {
                showMessage('loginMessage', result.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('loginMessage', 'Ошибка при входе: ' + error.message, 'error');
        }
    });
}

// Настройка формы регистрации
function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Валидация
        if (!firstName || !lastName || !phone || !password) {
            showMessage('registerMessage', 'Пожалуйста, заполните все обязательные поля (отмечены *)', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('registerMessage', 'Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('registerMessage', 'Пароль должен содержать минимум 6 символов', 'error');
            return;
        }
        
        if (!isValidPhone(phone)) {
            showMessage('registerMessage', `Пожалуйста, введите корректный номер телефона. Введен: ${phone}`, 'error');
            return;
}
        
        if (email && !isValidEmail(email)) {
            showMessage('registerMessage', 'Пожалуйста, введите корректный email', 'error');
            return;
        }
        
        try {
            const result = await apiRequest('auth.php', {
                action: 'register',
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                email: email,
                password: password
            });
            
            if (result.success) {
                showMessage('registerMessage', 'Регистрация успешна! Вы будете перенаправлены...', 'success');
                
                // Перенаправляем на главную страницу
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } else {
                showMessage('registerMessage', result.message, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('registerMessage', 'Ошибка регистрации: ' + error.message, 'error');
        }
    });
}