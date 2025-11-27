<?php
// config.php для UWAMP
class Config {
    // Настройки по умолчанию для UWAMP
    const DB_HOST = 'localhost';
    const DB_NAME = 'v_hotel';
    const DB_USER = 'root';
    const DB_PASS = 'root';
    const DB_CHARSET = 'utf8mb4';
    const DB_PORT = '3306';
    
    public static function getPDO() {
        $dsn = "mysql:host=" . self::DB_HOST . ";port=" . self::DB_PORT . ";dbname=" . self::DB_NAME . ";charset=" . self::DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        try {
            $pdo = new PDO($dsn, self::DB_USER, self::DB_PASS, $options);
            error_log("✅ Database connection successful to " . self::DB_NAME . " on UWAMP");
            return $pdo;
        } catch (PDOException $e) {
            error_log("❌ UWAMP Database connection FAILED: " . $e->getMessage());
            error_log("❌ Connection details: " . self::DB_USER . "@" . self::DB_HOST . ":" . self::DB_PORT . "/" . self::DB_NAME);
            throw new PDOException("UWAMP DB Error: " . $e->getMessage(), (int)$e->getCode());
        }
    }
}
?>