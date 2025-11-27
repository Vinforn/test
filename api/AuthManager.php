<?php
session_start();
header('Content-Type: application/json');

class AuthManager {
    
    public function checkAuth() {
        if (isset($_SESSION['user_id'])) {
            $user = [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['user_name'] ?? 'Пользователь',
                'email' => $_SESSION['user_email'] ?? '',
                'avatar' => $_SESSION['user_avatar'] ?? 'assets/images/user-icon.svg'
            ];
            
            return ['success' => true, 'user' => $user];
        }
        
        return ['success' => false, 'message' => 'Not authenticated'];
    }
    
    public function logout() {
        session_destroy();
        return ['success' => true, 'message' => 'Logged out successfully'];
    }
}

// Обработка запросов
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $authManager = new AuthManager();
    
    switch ($_GET['action']) {
        case 'check_auth':
            echo json_encode($authManager->checkAuth());
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Unknown action']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action'])) {
    $authManager = new AuthManager();
    
    switch ($_GET['action']) {
        case 'logout':
            echo json_encode($authManager->logout());
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Unknown action']);
    }
}
?>