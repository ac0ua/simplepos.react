<?php
/**
 * Scan Menu Image Endpoint
 * POST /php-backend/api/products/scan-menu.php
 * Uses Google Gemini AI to analyze menu images and extract items
 * Supports combo detection and image matching from default gallery
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';
require_once '../../utils/uuid.php';

// Gemini API configuration
define('GEMINI_API_KEY', 'AIzaSyAHBMdxYcNum1BZmnH82TBvJzSVF4vF6cY');
define('GEMINI_MODEL', 'gemini-2.5-flash-lite');
define('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/' . GEMINI_MODEL . ':generateContent');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

/**
 * Get list of default gallery images for matching
 */
function getDefaultGalleryImages() {
    $appRootDir = dirname(dirname(dirname(__DIR__)));
    $defaultDir = $appRootDir . '/backend/uploads/gallery/default';
    
    $images = [];
    if (is_dir($defaultDir)) {
        $files = scandir($defaultDir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            if (!preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file)) continue;
            
            // Extract name from filename (remove extension, replace dashes with spaces)
            $name = pathinfo($file, PATHINFO_FILENAME);
            $name = str_replace(['-', '_'], ' ', $name);
            $name = ucwords(strtolower($name));
            
            $images[] = [
                'filename' => $file,
                'name' => $name,
                'keywords' => explode(' ', strtolower($name))
            ];
        }
    }
    return $images;
}

/**
 * Find best matching gallery image for a menu item
 */
function findBestGalleryMatch($itemName, $galleryImages) {
    $itemName = strtolower(trim($itemName));
    $itemWords = preg_split('/[\s\-_]+/', $itemName);
    
    $bestMatch = null;
    $bestScore = 0;
    
    foreach ($galleryImages as $image) {
        $score = 0;
        $imageName = strtolower($image['name']);
        
        // Exact match
        if ($imageName === $itemName) {
            return $image['filename'];
        }
        
        // Check word overlap
        foreach ($itemWords as $word) {
            if (strlen($word) < 3) continue; // Skip short words
            
            foreach ($image['keywords'] as $keyword) {
                if ($keyword === $word) {
                    $score += 10;
                } elseif (strpos($keyword, $word) !== false || strpos($word, $keyword) !== false) {
                    $score += 5;
                }
            }
            
            // Check if word appears in full image name
            if (strpos($imageName, $word) !== false) {
                $score += 3;
            }
        }
        
        // Fuzzy matching for common variations
        $variations = [
            'burger' => ['cheeseburger', 'hamburger'],
            'soda' => ['pop', 'coke', 'pepsi', 'cola'],
            'fries' => ['french fries', 'potato'],
            'drink' => ['beverage', 'soda', 'pop', 'juice', 'tea', 'coffee'],
            'sandwich' => ['sub', 'hoagie'],
            'ice cream' => ['icecream', 'gelato', 'frozen'],
            'combo' => ['meal', 'deal'],
            'small' => ['sm', 's'],
            'medium' => ['med', 'm'],
            'large' => ['lg', 'l']
        ];
        
        foreach ($variations as $base => $alts) {
            if (strpos($itemName, $base) !== false) {
                foreach ($alts as $alt) {
                    if (strpos($imageName, $alt) !== false) {
                        $score += 4;
                    }
                }
            }
        }
        
        if ($score > $bestScore) {
            $bestScore = $score;
            $bestMatch = $image['filename'];
        }
    }
    
    return $bestScore >= 5 ? $bestMatch : null;
}

/**
 * Call Gemini API to analyze menu image
 */
function analyzeMenuWithGemini($imageBase64, $mimeType, $galleryImageNames) {
    $galleryList = implode(', ', array_slice($galleryImageNames, 0, 50));
    
    $prompt = <<<PROMPT
You are analyzing a menu image from a restaurant or food establishment. Extract all menu items visible in the image.

For each item, provide:
1. name: The exact name as shown on the menu
2. price: The price (number only, no currency symbol). If no price visible, estimate based on typical prices.
3. category: One of: beverages, snacks, frozen, automotive, fuel (use 'snacks' for most food items)
4. description: Brief description if visible, otherwise leave empty
5. isCombo: true if this is a combo/meal deal that includes multiple items
6. comboIncludes: If isCombo is true, list what's included (e.g., "drink, fries")
7. suggestedImage: Best matching image filename from this gallery list: {$galleryList}

Important rules:
- Extract ALL visible menu items
- For combos/meals, identify what's included (drinks, sides, etc.)
- Match items to the most relevant gallery image based on the item name
- If an item has size variants (small, medium, large), create separate entries
- Prices should be numbers only (e.g., 5.99 not $5.99)
- Be thorough - don't miss any items

Respond ONLY with a valid JSON array. No markdown, no explanation. Example format:
[
  {
    "name": "Cheeseburger Combo",
    "price": 8.99,
    "category": "snacks",
    "description": "Quarter pound beef patty with cheese",
    "isCombo": true,
    "comboIncludes": "medium drink, fries",
    "suggestedImage": "cheesburger.png"
  },
  {
    "name": "Large Coffee",
    "price": 2.99,
    "category": "beverages",
    "description": "",
    "isCombo": false,
    "comboIncludes": "",
    "suggestedImage": "coffee.png"
  }
]
PROMPT;

    $requestBody = [
        'contents' => [
            [
                'parts' => [
                    [
                        'text' => $prompt
                    ],
                    [
                        'inline_data' => [
                            'mime_type' => $mimeType,
                            'data' => $imageBase64
                        ]
                    ]
                ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0.2,
            'topK' => 32,
            'topP' => 1,
            'maxOutputTokens' => 8192
        ]
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => GEMINI_API_URL . '?key=' . GEMINI_API_KEY,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($requestBody),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 60
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception('Gemini API request failed: ' . $curlError);
    }

    if ($httpCode !== 200) {
        $errorData = json_decode($response, true);
        $errorMsg = $errorData['error']['message'] ?? 'Unknown error';
        throw new Exception('Gemini API error (' . $httpCode . '): ' . $errorMsg);
    }

    $data = json_decode($response, true);
    
    if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
        throw new Exception('Invalid response from Gemini API');
    }

    $text = $data['candidates'][0]['content']['parts'][0]['text'];
    
    // Clean up response - remove markdown code blocks if present
    $text = preg_replace('/^```json\s*/i', '', $text);
    $text = preg_replace('/\s*```$/i', '', $text);
    $text = trim($text);
    
    $items = json_decode($text, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Failed to parse Gemini response as JSON: ' . json_last_error_msg());
    }

    return $items;
}

try {
    // Get request data
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'multipart/form-data') !== false) {
        // Handle file upload
        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            Response::error('No image file uploaded or upload error');
        }
        
        $file = $_FILES['image'];
        $storeGuid = $_POST['storeGuid'] ?? null;
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, $allowedTypes)) {
            Response::error('Invalid image type. Allowed: JPEG, PNG, GIF, WebP');
        }
        
        // Read and encode image
        $imageData = file_get_contents($file['tmp_name']);
        $imageBase64 = base64_encode($imageData);
        
    } else {
        // Handle JSON with base64 image
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            Response::error('Invalid request body');
        }
        
        $storeGuid = $data['storeGuid'] ?? null;
        $imageBase64 = $data['image'] ?? null;
        $mimeType = $data['mimeType'] ?? 'image/jpeg';
        
        if (!$imageBase64) {
            Response::error('Image data is required');
        }
        
        // Remove data URL prefix if present
        if (preg_match('/^data:image\/(\w+);base64,/', $imageBase64, $matches)) {
            $mimeType = 'image/' . $matches[1];
            $imageBase64 = preg_replace('/^data:image\/\w+;base64,/', '', $imageBase64);
        }
    }
    
    if (!$storeGuid) {
        Response::error('Store GUID is required');
    }
    
    // Validate storeGuid
    if (!UUID::isValid($storeGuid)) {
        Response::error('Invalid Store GUID format');
    }
    
    // Get gallery images for matching
    $galleryImages = getDefaultGalleryImages();
    $galleryImageNames = array_map(function($img) { return $img['filename']; }, $galleryImages);
    
    // Analyze menu with Gemini
    $menuItems = analyzeMenuWithGemini($imageBase64, $mimeType, $galleryImageNames);
    
    // Enhance items with better image matching
    $appRootDir = dirname(dirname(dirname(__DIR__)));
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $phpBackendPos = strpos($scriptName, '/php-backend');
    $appBasePath = $phpBackendPos !== false
        ? substr($scriptName, 0, $phpBackendPos)
        : '';
    
    foreach ($menuItems as &$item) {
        // If Gemini didn't suggest an image or suggested one that doesn't exist, try our matching
        if (empty($item['suggestedImage']) || !in_array($item['suggestedImage'], $galleryImageNames)) {
            $match = findBestGalleryMatch($item['name'], $galleryImages);
            $item['suggestedImage'] = $match;
        }
        
        // Build full image URL
        if ($item['suggestedImage']) {
            $item['imageUrl'] = $appBasePath . '/backend/uploads/gallery/default/' . $item['suggestedImage'];
        } else {
            $item['imageUrl'] = null;
        }
        
        // Ensure all fields exist
        $item['name'] = $item['name'] ?? 'Unknown Item';
        $item['price'] = floatval($item['price'] ?? 0);
        $item['category'] = $item['category'] ?? 'snacks';
        $item['description'] = $item['description'] ?? '';
        $item['isCombo'] = $item['isCombo'] ?? false;
        $item['comboIncludes'] = $item['comboIncludes'] ?? '';
    }
    
    Response::success([
        'items' => $menuItems,
        'itemCount' => count($menuItems),
        'message' => 'Menu scanned successfully'
    ]);
    
} catch (Exception $e) {
    error_log('Scan menu error: ' . $e->getMessage());
    Response::serverError('Failed to scan menu: ' . $e->getMessage());
}
