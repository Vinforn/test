<?php
// auth.php - ИСПРАВЛЕННАЯ ВЕРСИЯ
header('Content-Type: application/json; charset=utf-8');
session_start();

// Включим отладку
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

try {
    // Получаем входные данные
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    $action = $input['action'] ?? '';
    
    if ($action === 'test') {
        echo json_encode(['success' => true, 'message' => 'API is working']);
        exit;
    }
    
    // Подключаем класс пользователя
    require_once 'User.php';
    
    if ($action === 'register') {
        $user = new User();
        $result = $user->register([
            'first_name' => $input['first_name'] ?? '',
            'last_name' => $input['last_name'] ?? '',
            'phone' => $input['phone'] ?? '',
            'email' => $input['email'] ?? '',
            'password' => $input['password'] ?? ''
        ]);
        
        echo json_encode($result);
        
    } elseif ($action === 'login') {
        $user = new User();
        $result = $user->login($input['phone'] ?? '', $input['password'] ?? '');
        
        if ($result['success']) {
            $_SESSION['user'] = $result['user'];
            $_SESSION['logged_in'] = true;
            $_SESSION['user_id'] = $result['user']['id']; // Ключевое исправление
        }
        
        echo json_encode($result);
            
    } elseif ($action === 'logout') {
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Выход выполнен']);
        
    } else {
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
    }
    
} catch (Exception $e) {
    error_log("Auth endpoint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Server error occurred'
    ]);
}
?>