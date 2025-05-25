<?php
header('Content-Type: application/json');

$room = $_GET['room'] ?? null;
$peer = $_GET['peer'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

if (!$room || !$peer) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing room or peer parameter']);
    exit;
}

$dataDir = __DIR__ . "/signaling_data/$room";
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
}

$filePath = "$dataDir/signaling.json";

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $allData = [];
    if (file_exists($filePath)) {
        $allData = json_decode(file_get_contents($filePath), true) ?? [];
    }

    $allData[$peer] = $input;
    file_put_contents($filePath, json_encode($allData));
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'GET') {
    $allData = [];
    if (file_exists($filePath)) {
        $allData = json_decode(file_get_contents($filePath), true) ?? [];
    }
    unset($allData[$peer]); // do not send own data back
    echo json_encode($allData);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
