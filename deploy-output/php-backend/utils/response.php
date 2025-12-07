<?php
/**
 * Response Utilities
 * Standard JSON response formatting
 */

class Response {
    public static function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit();
    }
    
    public static function success($data = [], $message = null) {
        $response = ['success' => true];
        if ($message) $response['message'] = $message;
        $response = array_merge($response, $data);
        self::json($response, 200);
    }
    
    public static function error($message, $statusCode = 400, $details = null) {
        $response = [
            'success' => false,
            'error' => $message
        ];
        if ($details) $response['details'] = $details;
        self::json($response, $statusCode);
    }
    
    public static function notFound($message = 'Resource not found') {
        self::error($message, 404);
    }
    
    public static function unauthorized($message = 'Unauthorized') {
        self::error($message, 401);
    }
    
    public static function serverError($message = 'Internal server error') {
        self::error($message, 500);
    }
}
