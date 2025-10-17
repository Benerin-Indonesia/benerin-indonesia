<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\User\PaymentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/
Route::post('/midtrans/webhook', [PaymentController::class, 'webhookHandler'])->name('webhook.midtrans');