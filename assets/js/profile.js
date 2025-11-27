// Логика для страницы профиля

document.addEventListener('DOMContentLoaded', function() {
    initializeProfilePage();
});

function initializeProfilePage() {
    if (!requireAuth()) return;
    
    loadProfileData();
    setupSaveProfile();
    setupLogout();
}

async function loadProfileData() {
    try {
        const result = await apiRequest('profile/profile.php?action=get_profile');
        
        if (result.success) {
            // Заполняем форму данными пользователя
            document.getElementById('firstName').value = result.user.first_name || '';
            document.getElementById('lastName').value = result.user.last_name || '';
            document.getElementById('phone').value = result.user.phone || '';
            document.getElementById('email').value = result.user.email || '';
            document.getElementById('documentNumber').value = result.user.document_number || '';
            
            // Заполняем выпадающие списки
            fillSelect('documentType', result.document_types, result.user.document_type_id);
            fillSelect('country', result.countries, result.user.country_id);
            
            // Сохраняем данные в localStorage
            saveUserData(result.user);
        } else {
            showMessage('saveMessage', 'Ошибка загрузки профиля: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage('saveMessage', 'Ошибка загрузки профиля: ' + error.message, 'error');
    }
}

function fillSelect(selectId, options, selectedValue) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Выберите...</option>';
    
    if (options && Array.isArray(options)) {
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.id;
            optionElement.textContent = option.name;
            if (option.id == selectedValue) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });
    }
}

function setupSaveProfile() {
    const saveBtn = document.getElementById('saveProfileBtn');
    if (!saveBtn) return;
    
    saveBtn.addEventListener('click', async () => {
        await saveProfile();
    });
}

async function saveProfile() {
    const formData = new FormData();
    formData.append('action', 'update_profile');
    formData.append('first_name', document.getElementById('firstName').value);
    formData.append('last_name', document.getElementById('lastName').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('document_type_id', document.getElementById('documentType').value);
    formData.append('document_number', document.getElementById('documentNumber').value);
    formData.append('country_id', document.getElementById('country').value);
    
    try {
        const response = await fetch('profile/profile.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('saveMessage', 'Данные успешно сохранены!', 'success');
            
            // Обновляем localStorage
            const userData = getUserData();
            userData.firstName = document.getElementById('firstName').value;
            userData.lastName = document.getElementById('lastName').value;
            userData.name = document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value;
            userData.phone = document.getElementById('phone').value;
            userData.email = document.getElementById('email').value;
            userData.documentType = document.getElementById('documentType').value;
            userData.documentNumber = document.getElementById('documentNumber').value;
            userData.country = document.getElementById('country').value;
            
            saveUserData(userData);
        } else {
            showMessage('saveMessage', 'Ошибка сохранения: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Save profile error:', error);
        showMessage('saveMessage', 'Ошибка сохранения: ' + error.message, 'error');
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', async () => {
        try {
            await apiRequest('/auth/auth.php', {
                action: 'logout'
            });
            
            // Очищаем localStorage и перенаправляем
            clearUserData();
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Все равно очищаем данные и перенаправляем
            clearUserData();
            window.location.href = '../index.html';
        }
    });
}