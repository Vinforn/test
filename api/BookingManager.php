<?php
// BookingManager.php - менеджер бронирований
require_once 'config.php';

class BookingManager {
    private $pdo;
    
    public function __construct() {
        try {
            $this->pdo = Config::getPDO();
            error_log("✅ BookingManager initialized with database connection");
        } catch (Exception $e) {
            error_log("❌ BookingManager initialization failed: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Создание нового бронирования
     */
    public function createBooking($bookingData) {
        try {
            error_log("🔍 Checking room availability...");
            
            // Проверяем доступность номера на указанные даты
            if (!$this->isRoomTypeAvailable($bookingData['room_type_id'], $bookingData['check_in'], $bookingData['check_out'])) {
                error_log("❌ Room not available");
                return ['success' => false, 'message' => 'Номер недоступен на выбранные даты'];
            }
            
            error_log("✅ Room is available");
            
            // Рассчитываем общую стоимость
            $totalAmount = $this->calculateTotalAmount(
                $bookingData['room_type_id'],
                $bookingData['check_in'],
                $bookingData['check_out']
            );
            
            error_log("💰 Total amount calculated: " . $totalAmount);
            
            // Создаем бронирование
            $sql = "INSERT INTO bookings (
                user_id, room_type_id, check_in, check_out, 
                guests_count, total_amount, payment_method_id, 
                booking_status, payment_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'pending', NOW())";
            
            $stmt = $this->pdo->prepare($sql);
            
            error_log("📝 Executing SQL: " . $sql);
            error_log("📦 With values: " . json_encode([
                $bookingData['user_id'],
                $bookingData['room_type_id'],
                $bookingData['check_in'],
                $bookingData['check_out'],
                $bookingData['guests_count'],
                $totalAmount,
                $bookingData['payment_method_id']
            ]));
            
            $stmt->execute([
                $bookingData['user_id'],
                $bookingData['room_type_id'],
                $bookingData['check_in'],
                $bookingData['check_out'],
                $bookingData['guests_count'],
                $totalAmount,
                $bookingData['payment_method_id']
            ]);
            
            $booking_id = $this->pdo->lastInsertId();
            
            error_log("🎉 Booking created successfully! ID: " . $booking_id);
            
            return [
                'success' => true, 
                'message' => 'Бронирование успешно создано',
                'booking_id' => $booking_id,
                'total_amount' => $totalAmount
            ];
            
        } catch (PDOException $e) {
            error_log("💥 CREATE BOOKING ERROR: " . $e->getMessage());
            error_log("💥 Error code: " . $e->getCode());
            error_log("💥 SQLSTATE: " . $e->errorInfo[0]);
            
            return [
                'success' => false, 
                'message' => 'Ошибка при создании бронирования: ' . $e->getMessage(),
                'debug' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Получение доступных типов номеров на указанные даты
     */
    public function getAvailableRoomTypes($check_in, $check_out) {
        try {
            error_log("🔍 Getting available room types for: $check_in to $check_out");
            
            // SQL запрос для получения доступных типов номеров
            $sql = "SELECT rt.*, 
                           rt.total_rooms as total_rooms,
                           (rt.total_rooms - COALESCE(booked_rooms.booked_count, 0)) as available_rooms
                    FROM room_types rt
                    LEFT JOIN (
                        SELECT room_type_id, COUNT(*) as booked_count
                        FROM bookings 
                        WHERE booking_status IN ('confirmed', 'pending')
                        AND is_visible = 1
                        AND (
                            (check_in BETWEEN ? AND ?) 
                            OR (check_out BETWEEN ? AND ?)
                            OR (check_in <= ? AND check_out >= ?)
                        )
                        GROUP BY room_type_id
                    ) as booked_rooms ON rt.id = booked_rooms.room_type_id
                    WHERE (rt.total_rooms - COALESCE(booked_rooms.booked_count, 0)) > 0 
                       OR booked_rooms.booked_count IS NULL
                    ORDER BY rt.price_per_night ASC";
            
            $stmt = $this->pdo->prepare($sql);
            
            // Выполняем запрос с параметрами дат
            $stmt->execute([
                $check_in, $check_out,
                $check_in, $check_out, 
                $check_in, $check_out
            ]);
            
            $available_rooms = $stmt->fetchAll();
            
            error_log("🏨 Found " . count($available_rooms) . " available room types");
            
            return $available_rooms;
            
        } catch (PDOException $e) {
            error_log("💥 Get available room types error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Получение всех типов номеров (без проверки доступности)
     */
    public static function getAllRoomTypes() {
        try {
            $pdo = Config::getPDO();
            $stmt = $pdo->query("SELECT * FROM room_types ORDER BY price_per_night ASC");
            $room_types = $stmt->fetchAll();
            
            error_log("🏨 Found " . count($room_types) . " room types");
            
            return $room_types;
        } catch (PDOException $e) {
            error_log("Get all room types error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Проверка доступности конкретного типа номера на даты
     */
    public function isRoomTypeAvailable($room_type_id, $check_in, $check_out) {
        try {
            $sql = "SELECT COUNT(*) as booked_count
                    FROM bookings 
                    WHERE room_type_id = ?
                    AND booking_status IN ('confirmed', 'pending')
                    AND is_visible = 1
                    AND (
                        (check_in BETWEEN ? AND ?) 
                        OR (check_out BETWEEN ? AND ?)
                        OR (check_in <= ? AND check_out >= ?)
                    )";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $room_type_id,
                $check_in, $check_out,
                $check_in, $check_out,
                $check_in, $check_out
            ]);
            
            $result = $stmt->fetch();
            
            // Получаем общее количество номеров этого типа
            $stmt2 = $this->pdo->prepare("SELECT total_rooms FROM room_types WHERE id = ?");
            $stmt2->execute([$room_type_id]);
            $room_type = $stmt2->fetch();
            
            $total_rooms = $room_type ? $room_type['total_rooms'] : 1;
            $is_available = $result['booked_count'] < $total_rooms;
            
            error_log("🔍 Room type $room_type_id available: " . ($is_available ? 'YES' : 'NO') . " (booked: {$result['booked_count']}, total: $total_rooms)");
            
            return $is_available;
            
        } catch (PDOException $e) {
            error_log("Room type availability check error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Получение бронирований пользователя
     */
    public function getUserBookings($user_id) {
        try {
            error_log("🔍 Getting bookings for user: " . $user_id);
            
            $sql = "SELECT b.*, 
                           rt.name as room_type_name, 
                           rt.price_per_night,
                           pm.name as payment_method_name
                    FROM bookings b
                    LEFT JOIN room_types rt ON b.room_type_id = rt.id
                    LEFT JOIN payment_methods pm ON b.payment_method_id = pm.id
                    WHERE b.user_id = ? AND b.is_visible = 1
                    ORDER BY b.created_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$user_id]);
            
            $bookings = $stmt->fetchAll();
            
            error_log("📋 Found " . count($bookings) . " bookings for user: " . $user_id);
            
            return $bookings;
            
        } catch (PDOException $e) {
            error_log("💥 Get user bookings error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Обновление статуса бронирования
     */
    public function updateBookingStatus($booking_id, $status) {
        try {
            $sql = "UPDATE bookings SET booking_status = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$status, $booking_id]);
            
            error_log("✅ Booking status updated: " . $booking_id . " -> " . $status);
            
            return ['success' => true, 'message' => 'Статус бронирования обновлен'];
            
        } catch (PDOException $e) {
            error_log("Update booking status error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Ошибка обновления статуса бронирования'];
        }
    }
    
    /**
     * Обновление статуса оплаты
     */
    public function updatePaymentStatus($booking_id, $status, $payment_method_id = null, $transaction_id = null) {
        try {
            $sql = "UPDATE bookings 
                    SET payment_status = ?, 
                        payment_method_id = ?,
                        transaction_id = ?,
                        payment_date = NOW()
                    WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$status, $payment_method_id, $transaction_id, $booking_id]);
            
            error_log("✅ Payment status updated: " . $booking_id . " -> " . $status);
            
            return ['success' => true, 'message' => 'Статус оплаты обновлен'];
            
        } catch (PDOException $e) {
            error_log("Update payment status error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Ошибка обновления статуса оплаты'];
        }
    }
    
    /**
     * Получение информации о бронировании
     */
    public function getBooking($booking_id) {
        try {
            $sql = "SELECT b.*, rt.name as room_type_name, rt.price_per_night,
                           pm.name as payment_method_name
                    FROM bookings b
                    LEFT JOIN room_types rt ON b.room_type_id = rt.id
                    LEFT JOIN payment_methods pm ON b.payment_method_id = pm.id
                    WHERE b.id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$booking_id]);
            
            $booking = $stmt->fetch();
            
            if ($booking) {
                error_log("📄 Booking found: " . $booking_id);
            } else {
                error_log("❌ Booking not found: " . $booking_id);
            }
            
            return $booking;
            
        } catch (PDOException $e) {
            error_log("Get booking error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Получение способов оплаты
     */
    public static function getPaymentMethods() {
        try {
            $pdo = Config::getPDO();
            $stmt = $pdo->query("SELECT * FROM payment_methods ORDER BY name");
            $payment_methods = $stmt->fetchAll();
            
            error_log("💳 Found " . count($payment_methods) . " payment methods");
            
            return $payment_methods;
        } catch (PDOException $e) {
            error_log("Get payment methods error: " . $e->getMessage());
            return [];
        }
    }
}
?>