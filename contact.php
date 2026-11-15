<?php
/**
 * Mang Jose Fried Chicken Corner — franchise / contact inquiry handler.
 * Uses PHP's built-in mail(). Configure the constants below.
 */
declare(strict_types=1);

// ====== CONFIGURATION ======
const MAIL_TO        = 'owner@example.com';              // <-- change to the inbox that should receive messages
const MAIL_FROM      = 'no-reply@mangjosefriedchicken.com'; // must be an address on your own domain
const MAIL_SUBJECT   = 'New inquiry from Mang Jose website';
const MIN_FILL_MS    = 3000;   // reject forms submitted faster than this (bots)
const RATE_LIMIT_SEC = 30;     // one message per IP per N seconds
// ===========================

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(bool $ok, string $message, int $code = 200): void {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Method not allowed.', 405);
}

// Same-origin check (if the browser sent an Origin header)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host   = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url('//' . $host, PHP_URL_HOST)) {
    respond(false, 'Invalid request origin.', 403);
}

// Honeypot
if (!empty($_POST['website'])) {
    respond(true, 'Thank you! We will get back to you soon.'); // silently accept bots
}

// Timing trap
$ts = (int)($_POST['ts'] ?? 0);
if ($ts > 0 && (microtime(true) * 1000 - $ts) < MIN_FILL_MS) {
    respond(false, 'Please take a moment before sending.', 429);
}

// Simple per-IP rate limit using a temp file
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$lock = sys_get_temp_dir() . '/mangjose_' . hash('sha256', $ip);
if (is_file($lock) && (time() - (int)filemtime($lock)) < RATE_LIMIT_SEC) {
    respond(false, 'You just sent a message. Please wait a few seconds and try again.', 429);
}

// Collect & sanitize
$clean = static function (string $key, int $max): string {
    return mb_substr(trim((string)($_POST[$key] ?? '')), 0, $max);
};
$name    = $clean('name', 80);
$email   = trim((string)($_POST['email'] ?? ''));
$phone    = $clean('phone', 30);
$location = $clean('location', 100);
$interest = $clean('interest', 40);
$message  = mb_substr(trim((string)($_POST['message'] ?? '')), 0, 2000);

// Header-injection guard for single-line fields
foreach ([$name, $email, $phone, $location, $interest] as $v) {
    if (preg_match('/[\r\n]/', $v)) respond(false, 'Invalid input.', 400);
}

$errors = [];
if (mb_strlen($name) < 2)                          $errors[] = 'name';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))    $errors[] = 'email';
if (mb_strlen($message) < 10)                      $errors[] = 'message';
$allowedInterests = ['Franchise inquiry', 'Partnership or investment', 'General question'];
if (!in_array($interest, $allowedInterests, true)) $interest = 'Franchise inquiry';

if ($errors) {
    respond(false, 'Please check your ' . implode(', ', $errors) . '.', 422);
}

// Build email
$body  = "New {$interest} from the Mang Jose website\n";
$body .= str_repeat('-', 40) . "\n";
$body .= "Name:      {$name}\n";
$body .= "Email:     {$email}\n";
$body .= "Phone:     " . ($phone !== '' ? $phone : '—') . "\n";
$body .= "Location:  " . ($location !== '' ? $location : '—') . "\n";
$body .= "Interest:  {$interest}\n";
$body .= str_repeat('-', 40) . "\n\n";
$body .= $message . "\n\n";
$body .= "—\nSent " . date('Y-m-d H:i') . " from IP {$ip}\n";

$headers = [
    'From: Mang Jose Website <' . MAIL_FROM . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP/' . PHP_VERSION,
];

$subject = '=?UTF-8?B?' . base64_encode(MAIL_SUBJECT . ' (' . $interest . ') — ' . $name) . '?=';
$sent = @mail(MAIL_TO, $subject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

if (!$sent) {
    respond(false, 'Sorry, we could not send your message right now. Please message us on Facebook.', 500);
}

@touch($lock);
respond(true, 'Salamat! Your message has been sent. We will get back to you soon.');
