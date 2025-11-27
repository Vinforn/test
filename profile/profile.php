<?php
// profile.php
require_once '../api/User.php';

header('Content-Type: application/json; charset=utf-8');
session_start();

// Проверяем авторизацию
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    echo json_encode(['success' => false, 'message' => 'Не авторизован']);
    exit;
}

$user = new User();
$user_id = $_SESSION['user_id'] ?? $_SESSION['user']['id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'ID пользователя не найден']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Получение данных профиля
    if (isset($_GET['action']) && $_GET['action'] === 'get_profile') {
        $user_data = $user->getById($user_id);
        
        if ($user_data) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'first_name' => $user_data['first_name'],
                    'last_name' => $user_data['last_name'],
                    'phone' => $user_data['phone'],
                    'email' => $user_data['email'],
                    'document_type_id' => $user_data['document_type_id'],
                    'document_number' => $user_data['document_number'],
                    'country_id' => $user_data['country_id']
                ],
                'countries' => User::getCountries(),
                'document_types' => User::getDocumentTypes()
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
        }
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Если не получилось через json, пробуем через form-data
    if ($input === null) {
        $input = $_POST;
    }
    
    // Обновление профиля
    if (isset($input['action']) && $input['action'] === 'update_profile') {
        $result = $user->updateProfile($user_id, [
            'first_name' => $input['first_name'] ?? '',
            'last_name' => $input['last_name'] ?? '',
            'phone' => $input['phone'] ?? '',
            'email' => $input['email'] ?? '',
            'document_type_id' => $input['document_type_id'] ?? null,
            'document_number' => $input['document_number'] ?? '',
            'country_id' => $input['country_id'] ?? null
        ]);
        
        // Обновляем сессию
        if ($result['success']) {
            $_SESSION['user'] = [
                'id' => $user_id,
                'first_name' => $input['first_name'] ?? '',
                'last_name' => $input['last_name'] ?? '',
                'phone' => $input['phone'] ?? '',
                'email' => $input['email'] ?? '',
                'document_type_id' => $input['document_type_id'] ?? null,
                'document_number' => $input['document_number'] ?? '',
                'country_id' => $input['country_id'] ?? null
            ];
        }
        
        echo json_encode($result);
    }
}
?>