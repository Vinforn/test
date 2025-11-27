<?php
// User.php - класс пользователя
require_once 'config.php';

class User {
    private $pdo;
    
    public function __construct() {
        try {
            $this->pdo = Config::getPDO();
            error_log("✅ User class initialized with database connection");
        } catch (Exception $e) {
            error_log("❌ User class initialization failed: " . $e->getMessage());
            throw $e;
        }
    }

    // РЕГИСТРАЦИЯ пользователя
    public function register($data) {
        error_log("🔵 Starting registration for: " . ($data['phone'] ?? 'unknown'));
        
        try {
            // Валидация обязательных полей
            $required = ['first_name', 'last_name', 'phone', 'password'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    error_log("❌ Missing required field: " . $field);
                    return ['success' => false, 'message' => "Поле {$field} обязательно для заполнения"];
                }
            }

            // Проверяем существующего пользователя по телефону
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE phone = ?");
            $stmt->execute([$data['phone']]);
            
            if ($stmt->fetch()) {
                return ['success' => false, 'message' => 'Пользователь с таким телефоном уже существует'];
            }

            // Хэшируем пароль
            $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

            // Вставляем пользователя
            $sql = "
                INSERT INTO users 
                (first_name, last_name, phone, email, password_hash, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['first_name'],
                $data['last_name'],
                $data['phone'],
                $data['email'] ?? null,
                $password_hash
            ]);

            $user_id = $this->pdo->lastInsertId();
            
            return [
                'success' => true, 
                'message' => 'Регистрация успешна',
                'user_id' => $user_id
            ];

        } catch (PDOException $e) {
            error_log("💥 REGISTRATION ERROR: " . $e->getMessage());
            return [
                'success' => false, 
                'message' => 'Ошибка базы данных при регистрации'
            ];
        }
    }

    // АВТОРИЗАЦИЯ пользователя
    public function login($phone, $password) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM users 
                WHERE phone = ?
            ");
            $stmt->execute([$phone]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                return [
                    'success' => true,
                    'message' => 'Вход успешен',
                    'user' => [
                        'id' => $user['id'],
                        'first_name' => $user['first_name'],
                        'last_name' => $user['last_name'],
                        'phone' => $user['phone'],
                        'email' => $user['email'],
                        'document_type_id' => $user['document_type_id'],
                        'document_number' => $user['document_number'],
                        'country_id' => $user['country_id'],
                        'created_at' => $user['created_at']
                    ]
                ];
            } else {
                return ['success' => false, 'message' => 'Неверный телефон или пароль'];
            }

        } catch (PDOException $e) {
            error_log("Login error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Ошибка базы данных при входе'];
        }
    }

    // Получение пользователя по ID
    public function getById($id) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Get user error: " . $e->getMessage());
            return null;
        }
    }

    // Обновление профиля пользователя
    public function updateProfile($user_id, $data) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE users 
                SET first_name = ?, last_name = ?, phone = ?, email = ?, 
                    document_type_id = ?, document_number = ?, country_id = ?
                WHERE id = ?
            ");

            $document_type_id = !empty($data['document_type_id']) ? $data['document_type_id'] : null;
            $country_id = !empty($data['country_id']) ? $data['country_id'] : null;

            $stmt->execute([
                $data['first_name'] ?? '',
                $data['last_name'] ?? '',
                $data['phone'] ?? '',
                $data['email'] ?? '',
                $document_type_id,
                $data['document_number'] ?? '',
                $country_id,
                $user_id
            ]);

            return ['success' => true, 'message' => 'Профиль успешно обновлен'];

        } catch (PDOException $e) {
            error_log("Update profile error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Ошибка при обновлении профиля: ' . $e->getMessage()];
        }
    }

    // Получение всех стран
    public static function getCountries() {
        try {
            $pdo = Config::getPDO();
            $stmt = $pdo->query("SELECT * FROM countries ORDER BY name");
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Get countries error: " . $e->getMessage());
            return [];
        }
    }

    // Получение всех типов документов
    public static function getDocumentTypes() {
        try {
            $pdo = Config::getPDO();
            $stmt = $pdo->query("SELECT * FROM document_types ORDER BY name");
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Get document types error: " . $e->getMessage());
            return [];
        }
    }

    // Проверка существования пользователя по телефону
    public function userExists($phone) {
        try {
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE phone = ?");
            $stmt->execute([$phone]);
            return (bool) $stmt->fetch();
        } catch (PDOException $e) {
            error_log("User exists check error: " . $e->getMessage());
            return false;
        }
    }
}
?>