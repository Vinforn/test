// Сначала проверим доступность API
async function testAPI() {
  try {
    const response = await fetch('../auth/auth.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'test' })
    });
    
    const result = await response.json();
    console.log('API test result:', result);
    return result.success;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
}

// Основной обработчик формы
document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  
  const messageDiv = document.getElementById("registerMessage");
  
  // Базовая валидация
  if (!firstName || !lastName || !phone || !password) {
    showMessage("Пожалуйста, заполните все обязательные поля (отмечены *)", "error");
    return;
  }
  
  if (password !== confirmPassword) {
    showMessage("Пароли не совпадают", "error");
    return;
  }
  
  if (password.length < 6) {
    showMessage("Пароль должен содержать минимум 6 символов", "error");
    return;
  }
  
  try {
    const response = await fetch('../auth/auth.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: email,
        password: password
      })
    });
    
    // Проверяем, что ответ - JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      showMessage("Сервер вернул некорректный ответ. Проверьте консоль для подробностей.", "error");
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      showMessage("Регистрация успешна! Вы будете перенаправлены...", "success");
      
      // Сохраняем в localStorage
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("userId", result.user_id);
      localStorage.setItem("userFirstName", firstName);
      localStorage.setItem("userLastName", lastName);
      localStorage.setItem("userName", firstName + ' ' + lastName);
      localStorage.setItem("userPhone", phone);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("regDate", new Date().toLocaleDateString());
      
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } else {
      showMessage(result.message, "error");
    }
  } catch (error) {
    console.error('Registration error:', error);
    showMessage("Ошибка сети или сервера. Проверьте консоль для подробностей.", "error");
  }
});

function showMessage(message, type) {
  const messageDiv = document.getElementById("registerMessage");
  messageDiv.textContent = message;
  messageDiv.style.display = 'block';
  messageDiv.style.background = type === 'success' ? '#d4edda' : '#f8d7da';
  messageDiv.style.color = type === 'success' ? '#155724' : '#721c24';
  messageDiv.style.border = type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
}

// Тестируем API при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
  const apiWorking = await testAPI();
  if (!apiWorking) {
    showMessage("Внимание: API сервера недоступно. Регистрация может не работать.", "error");
  }
});