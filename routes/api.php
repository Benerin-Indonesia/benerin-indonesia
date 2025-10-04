<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\User\PaymentController; // Sesuaikan dengan path controller Anda

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Nama 'webhook.midtrans' lebih deskriptif daripada 'payment'.
Route::post('/midtrans/webhook', [PaymentController::class, 'webhookHandler'])->name('webhook.midtrans');