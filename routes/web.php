<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\Auth\PublicAuthController;
use App\Http\Controllers\Auth\UserAuthController;
use App\Http\Controllers\Auth\TechnicianAuthController;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Admin\Auth\AdminPasswordResetLinkController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\TechnicianServiceController as AdminTechnicianServiceController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ServiceRequestController as AdminServiceRequestController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\PayoutController as AdminPayoutController;
use App\Http\Controllers\Admin\BalanceController as AdminBalanceController;

// Fitur user & teknisi
use App\Http\Controllers\User\userController;
use App\Http\Controllers\Teknisi\TechnicianController;
use App\Http\Controllers\ServiceRequest\Teknisi\ServiceRequestController as TechnicianServiceRequestController;
use App\Http\Controllers\ServiceRequest\User\ServiceRequestController as UserServiceRequestController;
use App\Http\Controllers\User\PaymentController;

/* -------------------- Public / Landing -------------------- */

Route::get('/', [LandingPageController::class, 'index'])->name('home');
Route::get('/login',    [PublicAuthController::class, 'showLoginChoice'])->name('login.choice');
Route::get('/register', [PublicAuthController::class, 'showRegisterChoice'])->name('register.choice');
Route::get('/ketentuan', fn() => Inertia::render('public/ketentuan'))->name('terms');
Route::get('/privasi', fn() => Inertia::render('public/privasi'))->name('privasi');

/* -------------------- USER -------------------- */
Route::prefix('user')->name('user.')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/login',    [UserAuthController::class, 'showLoginForm'])->name('login.show');
        Route::post('/login',   [UserAuthController::class, 'login'])->name('login');

        Route::get('/register', [UserAuthController::class, 'showRegisterForm'])->name('register.show');
        Route::post('/register', [UserAuthController::class, 'register'])->name('register');
    });

    Route::post('/logout', function (Request $request) {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login.choice');
    })->name('logout');

    // ==== Middleware Hanya untuk user role ====
    Route::middleware(['auth', 'role:user'])->group(function () {
        // Home user
        Route::get('/home', [userController::class, 'index'])->name('dashboard');

        // Request Form
        Route::get('/permintaan/buat', [UserServiceRequestController::class, 'buatPermintaan'])
            ->name('permintaan.create');
        Route::post('/permintaan/simpan', [UserServiceRequestController::class, 'store'])
            ->name('permintaan.store');

        // Service request user
        Route::get('/permintaan/{id}', [UserServiceRequestController::class, 'show'])
            ->name('permintaan.show');
        Route::post('/permintaan-harga', [UserServiceRequestController::class, 'createPrice'])
            ->name('permintaan.request-price');
        Route::post('/permintaan/{id}/accept-price', [UserServiceRequestController::class, 'acceptPrice'])
            ->name('permintaan.accept-price');
        Route::post('/permintaan/{id}/reject-price', [UserServiceRequestController::class, 'rejectPrice'])
            ->name('permintaan.reject-price');
        Route::post('/permintaan/{id}/end', [UserServiceRequestController::class, 'endService'])
            ->name('permintaan.end-service');
        Route::post('/permintaan/{id}/refund', [UserServiceRequestController::class, 'refund'])
            ->name('permintaan.refund');

        // Payment
        Route::get('/payment/{payment}', [PaymentController::class, 'showPaymentPage'])->name('payment.show');
        Route::post('/payment', [PaymentController::class, 'paymentHandler'])->name('payment');
        Route::post('/payment/success', [PaymentController::class, 'paymentSuccess'])->name('payment.success');
        Route::post('/payment/pending', [PaymentController::class, 'paymentPending'])->name('payment.pending');
        Route::post('/payment/fail', [PaymentController::class, 'paymentFail'])->name('payment.fail');
    });
});


/* -------------------- TEKNISI -------------------- */
Route::prefix('teknisi')->name('teknisi.')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/login',    [TechnicianAuthController::class, 'showLoginForm'])->name('login.show');
        Route::post('/login',   [TechnicianAuthController::class, 'login'])->name('login');

        Route::get('/register', [TechnicianAuthController::class, 'showRegisterForm'])->name('register.show');
        Route::post('/register', [TechnicianAuthController::class, 'register'])->name('register');
    });

    Route::post('/logout', function (Request $request) {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login.choice');
    })->name('logout');

    Route::middleware(['auth', 'role:teknisi'])->group(function () {

        Route::get('/home', [TechnicianController::class, 'index'])->name('dashboard');

        // Activity toggle
        Route::post('/toggle-activity', [TechnicianController::class, 'toggleAvailability'])
            ->name('toggle-availability');

        // Teknisi Service Request
        Route::get('/permintaan/{id}', [TechnicianServiceRequestController::class, 'show'])->name('service.show');
        Route::post('/permintaan-harga', [TechnicianServiceRequestController::class, 'createPrice'])->name('technician-service.request-price');
    });
});

/* -------------------- ADMIN Auth (publik) -------------------- */
Route::prefix('admin')->name('admin.')->group(function () {
    // Jika sudah login:
    // - admin  -> redirect ke /admin/dashboard
    // - non-admin -> redirect ke /dashboard (router role)
    // - belum login -> redirect ke /admin/login
    Route::get('/', function () {
        if (Auth::check()) {
            if (Auth::user()->role === 'admin') {
                return redirect()->route('admin.dashboard');
            }
            return redirect()->route('dashboard');
        }
        return redirect()->route('admin.login.show');
    })->name('root');

    Route::get('/login', function () {
        if (Auth::check()) {
            if (Auth::user()->role === 'admin') {
                return redirect()->route('admin.dashboard');
            }
            return redirect()->route('dashboard');
        }

        return app(AdminAuthController::class)->showLoginForm();
    })->name('login.show');

    Route::post('/login', [AdminAuthController::class, 'login'])->name('login');

    Route::get('/forgot-password', fn() => Inertia::render('admin/forgot-password'))
        ->name('password.request');
    Route::post('/forgot-password', [AdminPasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('/reset-password/{token}', function (string $token) {
        return redirect()->route('admin.password.request')
            ->with('status', 'Tautan reset diterima. Silakan ikuti instruksi di email untuk menyetel ulang password.');
    })->name('password.reset');
});

/* -------------------- ADMIN Panel (proteksi ensure_admin) -------------------- */
Route::prefix('admin')
    ->name('admin.')
    ->middleware('ensure_admin')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::post('/logout', function (Request $request) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('admin.login.show');
        })->name('logout');

        Route::resource('users', AdminUserController::class)
            ->only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
            ->parameters(['users' => 'id']);

        Route::resource('technician-services', AdminTechnicianServiceController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['technician-services' => 'id']);

        Route::resource('categories', AdminCategoryController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['categories' => 'id']);

        Route::resource('requests', AdminServiceRequestController::class)
            ->only(['index', 'show'])
            ->parameters(['requests' => 'id']);

        Route::resource('payments', AdminPaymentController::class)
            ->only(['index', 'show'])
            ->parameters(['payments' => 'id']);

        Route::resource('payouts', AdminPayoutController::class)
            ->only(['index', 'show'])
            ->parameters(['payouts' => 'id']);

        Route::resource('balances', AdminbalanceController::class)
            ->only(['index'])
            ->parameters(['balances' => 'id']);
    });

/* -------------------- Shortcut /dashboard -------------------- */
Route::get('/dashboard', function () {
    $user = Auth::user();
    if (!$user) return redirect()->route('login.choice');

    return match ($user->role) {
        'teknisi' => redirect()->route('teknisi.dashboard'),
        'admin'   => redirect()->route('admin.dashboard'),
        default   => redirect()->route('user.dashboard'),
    };
})->name('dashboard');
