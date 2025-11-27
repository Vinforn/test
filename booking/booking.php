<?php
// booking.php - обработчик бронирования
require_once '../api/BookingManager.php';

header('Content-Type: application/json; charset=utf-8');
session_start();

// Включим отладку
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Создаем лог-файл для отладки
$log_file = __DIR__ . '/../logs/booking_debug.log';
$timestamp = date('Y-m-d H:i:s');

try {
    // Логируем запрос
    error_log("[$timestamp] 📥 BOOKING REQUEST START\n", 3, $log_file);
    error_log("[$timestamp] Method: " . $_SERVER['REQUEST_METHOD'] . "\n", 3, $log_file);
    error_log("[$timestamp] Input: " . file_get_contents('php://input') . "\n", 3, $log_file);

    // Проверяем авторизацию
    if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
        error_log("[$timestamp] ❌ User not authorized\n", 3, $log_file);
        echo json_encode(['success' => false, 'message' => 'Не авторизован']);
        exit;
    }

    $user_id = $_SESSION['user_id'] ?? $_SESSION['user']['id'] ?? null;
    
    if (!$user_id) {
        error_log("[$timestamp] ❌ User ID not found in session\n", 3, $log_file);
        echo json_encode(['success' => false, 'message' => 'ID пользователя не найден в сессии']);
        exit;
    }

    error_log("[$timestamp] ✅ User ID: " . $user_id . "\n", 3, $log_file);

    $bookingManager = new BookingManager();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? '';
        
        if ($action === 'get_room_types') {
            error_log("[$timestamp] 📋 Getting room types\n", 3, $log_file);
            $room_types = BookingManager::getAllRoomTypes();
            echo json_encode(['success' => true, 'room_types' => $room_types]);
            
        } elseif ($action === 'get_booking') {
            $booking_id = $_GET['booking_id'] ?? '';
            error_log("[$timestamp] 📄 Getting booking: " . $booking_id . "\n", 3, $log_file);
            $booking = $bookingManager->getBooking($booking_id);
            
            if ($booking && $booking['user_id'] == $user_id) {
                echo json_encode(['success' => true, 'booking' => $booking]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Бронирование не найдено']);
            }
        } else {
            error_log("[$timestamp] ❌ Unknown GET action: " . $action . "\n", 3, $log_file);
            echo json_encode(['success' => false, 'message' => 'Неизвестное действие: ' . $action]);
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($input === null) {
            $input = $_POST;
        }
        
        error_log("[$timestamp] 📦 Parsed input: " . json_encode($input) . "\n", 3, $log_file);
        
        $action = $input['action'] ?? '';
        
        if ($action === 'create_booking') {
            error_log("[$timestamp] 🆕 Creating new booking\n", 3, $log_file);
            
            // Валидация обязательных полей
            $required = ['room_type_id', 'check_in', 'check_out', 'guests_count'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    error_log("[$timestamp] ❌ Missing required field: " . $field . "\n", 3, $log_file);
                    echo json_encode(['success' => false, 'message' => "Поле {$field} обязательно для заполнения"]);
                    exit;
                }
            }
            
            $bookingData = [
                'user_id' => $user_id,
                'room_type_id' => $input['room_type_id'],
                'check_in' => $input['check_in'],
                'check_out' => $input['check_out'],
                'guests_count' => $input['guests_count'],
                'payment_method_id' => $input['payment_method_id'] ?? null
            ];
            
            error_log("[$timestamp] 📝 Booking data: " . json_encode($bookingData) . "\n", 3, $log_file);
            
            $result = $bookingManager->createBooking($bookingData);
            error_log("[$timestamp] 📤 Booking result: " . json_encode($result) . "\n", 3, $log_file);
            
            echo json_encode($result);
            
        } elseif ($action === 'get_bookings') {
            error_log("[$timestamp] 📚 Getting bookings for user: " . $user_id . "\n", 3, $log_file);
            
            $bookings = $bookingManager->getUserBookings($user_id);
            error_log("[$timestamp] 📋 Found " . count($bookings) . " bookings\n", 3, $log_file);
            
            echo json_encode([
                'success' => true, 
                'bookings' => $bookings,
                'count' => count($bookings)
            ]);
            
        } elseif ($action === 'cancel_booking') {
            $booking_id = $input['booking_id'] ?? '';
            error_log("[$timestamp] ❌ Canceling booking: " . $booking_id . "\n", 3, $log_file);
            
            $result = $bookingManager->updateBookingStatus($booking_id, 'cancelled');
            echo json_encode($result);
            
        } elseif ($action === 'get_available_rooms') {
            $check_in = $input['check_in'] ?? date('Y-m-d');
            $check_out = $input['check_out'] ?? date('Y-m-d', strtotime('+1 day'));
            
            error_log("[$timestamp] 🏨 Getting available rooms for: $check_in to $check_out\n", 3, $log_file);
            
            $available_rooms = $bookingManager->getAvailableRoomTypes($check_in, $check_out);
            echo json_encode([
                'success' => true, 
                'available_rooms' => $available_rooms,
                'check_in' => $check_in,
                'check_out' => $check_out
            ]);
            
        } elseif ($action === 'get_all_rooms') {
            error_log("[$timestamp] 🏨 Getting all room types\n", 3, $log_file);
            
            $all_rooms = BookingManager::getAllRoomTypes();
            echo json_encode([
                'success' => true, 
                'room_types' => $all_rooms
            ]);
            
        } elseif ($action === 'check_availability') {
            $room_type_id = $input['room_type_id'] ?? '';
            $check_in = $input['check_in'] ?? '';
            $check_out = $input['check_out'] ?? '';
            
            error_log("[$timestamp] 🔍 Checking availability for room: $room_type_id, dates: $check_in to $check_out\n", 3, $log_file);
            
            $is_available = $bookingManager->isRoomTypeAvailable($room_type_id, $check_in, $check_out);
            echo json_encode([
                'success' => true, 
                'is_available' => $is_available,
                'room_type_id' => $room_type_id
            ]);
            
        } else {
            error_log("[$timestamp] ❌ Unknown POST action: " . $action . "\n", 3, $log_file);
            echo json_encode(['success' => false, 'message' => 'Неизвестное действие: ' . $action]);
        }
    } else {
        error_log("[$timestamp] ❌ Invalid request method: " . $_SERVER['REQUEST_METHOD'] . "\n", 3, $log_file);
        echo json_encode(['success' => false, 'message' => 'Неподдерживаемый метод запроса']);
    }
    
} catch (Exception $e) {
    error_log("[$timestamp] 💥 BOOKING ENDPOINT ERROR: " . $e->getMessage() . "\n", 3, $log_file);
    error_log("[$timestamp] 💥 Stack trace: " . $e->getTraceAsString() . "\n", 3, $log_file);
    
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Внутренняя ошибка сервера при бронировании',
        'debug' => $e->getMessage()
    ]);
}

error_log("[$timestamp] 📤 BOOKING REQUEST END\n\n", 3, $log_file);
?>