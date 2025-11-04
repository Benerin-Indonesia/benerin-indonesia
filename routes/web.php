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
use App\Http\Controllers\Admin\Auth\AdminNewPasswordController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\TechnicianServiceController as AdminTechnicianServiceController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ServiceRequestController as AdminServiceRequestController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\PayoutController as AdminPayoutController;
use App\Http\Controllers\Admin\BalanceController as AdminBalanceController;

// Fitur user & teknisi
use App\Http\Controllers\Chat\ChatMessageController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\User\PaymentController;
use App\Http\Controllers\User\ProfileController;
use App\Http\Controllers\Teknisi\TechnicianController;
use App\Http\Controllers\Teknisi\PayoutController as TechnicianpayoutController;
use App\Http\Controllers\Teknisi\ProfileController as TeknisiProfileController;
use App\Http\Controllers\ServiceRequest\Teknisi\ServiceRequestController as TechnicianServiceRequestController;
use App\Http\Controllers\ServiceRequest\User\ServiceRequestController as UserServiceRequestController;

/* -------------------- Public / Landing -------------------- */

Route::get('/', [LandingPageController::class, 'index'])->name('home');
Route::get('/login',    [PublicAuthController::class, 'showLoginChoice'])->name('login');
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
        Route::get('/home', [UserController::class, 'index'])->name('dashboard');

        // Help page
        Route::get('/bantuan', function () {
            return Inertia::render('user/help-page');
        });

        // Profile Page
        Route::get('/profile', [ProfileController::class, 'index'])->name('profile.index');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');

        // Request Form
        Route::get('/permintaan/buat', [UserServiceRequestController::class, 'buatPermintaan'])
            ->name('permintaan.create')->middleware('throttle:permintaan-limit');
        Route::post('/permintaan/simpan', [UserServiceRequestController::class, 'store'])
            ->name('permintaan.store')->middleware('throttle:permintaan-limit');

        //Wallet
        // Route::get('/wallet', [WalletController::class, 'indexUser'])->name('wallet');

        //Refund
        Route::get('/refund', [UserController::class, 'refundIndex'])->name('refund.index');
        Route::get('/permintaan/{id}/refund', [UserController::class, 'refundCreate'])->name('refund.create');
        Route::post('/permintaan/refund', [UserController::class, 'refundStore'])->name('refund.store')->middleware('throttle:permintaan-limit');

        // Service request user
        Route::get('/permintaan', [UserServiceRequestController::class, 'index'])->name('permintaan.index');
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
        Route::post('/permintaan/{id}/refund', [UserController::class, 'refundCreate'])
            ->name('permintaan.refund');

        // show all Categories
        Route::get('/categories', [UserServiceRequestController::class, 'categoriesIndex'])->name('categories');

        // Payment
        Route::get('/payment', function () {
            return redirect()->back();
        });
        Route::post('/payment', [PaymentController::class, 'paymentHandler'])->name('payment');
        Route::post('/payment/success', [PaymentController::class, 'paymentSuccess'])->name('payment.success');
        Route::post('/payment/pending', [PaymentController::class, 'paymentPending'])->name('payment.pending');
        Route::post('/payment/fail', [PaymentController::class, 'paymentFail'])->name('payment.fail');

        //chat
        Route::post('/chat/request/{serviceRequest}', [ChatMessageController::class, 'store'])->name('chat.store');
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
        Route::post('/availability/toggle', [TechnicianController::class, 'toggleAvailability'])->name('availability.toggle');
        Route::post('/categories/toggle-status', [TechnicianController::class, 'toggleCategoryStatus'])->name('categories.toggle');

        //Profile
        Route::get('/profile', [TeknisiProfileController::class, 'index'])->name('profile');
        Route::patch('/profile', [TeknisiProfileController::class, 'update'])->name('profile.update');

        // Wallet & Withdraw
        Route::get('/wallet', [TeknisiProfileController::class, 'walletIndex'])->name('wallet');
        Route::get('/withdraw/create', [TeknisiProfileController::class, 'walletWithdrawCreate'])->name('withdraw.create');
        Route::post('/withdraw', [TeknisiProfileController::class, 'walletWithdrawStore'])->name('withdraw.store');

        //Help
        Route::get('/bantuan', function () {
            return Inertia::render('teknisi/help');
        })->name('help');

        // Payout
        Route::get('/pencairan-dana', [TechnicianpayoutController::class, 'index'])->name('payout.index');

        // Teknisi Service Request
        Route::get('/permintaan', [TechnicianServiceRequestController::class, 'index'])->name('service');
        Route::get('/jadwal', [TechnicianServiceRequestController::class, 'indexJadwal'])->name('jadwal');
        Route::get('/permintaan/{id}', [TechnicianServiceRequestController::class, 'show'])->name('service.show');
        Route::post('/permintaan-harga', [TechnicianServiceRequestController::class, 'createPrice'])->name('technician-service.request-price');

        //chat
        Route::post('/chat/request/{serviceRequest}', [ChatMessageController::class, 'store'])->name('chat.store');
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
            return Auth::user()->role === 'admin'
                ? redirect()->route('admin.dashboard')
                : redirect()->route('dashboard');
        }
        return redirect()->route('admin.login.show');
    })->name('root');

    Route::get('login', function () {
        if (Auth::check()) {
            return Auth::user()->role === 'admin'
                ? redirect()->route('admin.dashboard')
                : redirect()->route('dashboard');
        }
        return app(AdminAuthController::class)->showLoginForm();
    })->name('login.show');

    Route::post('/login', [AdminAuthController::class, 'login'])->name('login');

    // Admin Forgot/Reset Password (khusus admin)
    Route::get('forgot-password', fn() => Inertia::render('admin/forgot-password'))
        ->name('password.request');
    Route::post('forgot-password', [AdminPasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [AdminNewPasswordController::class, 'create'])
        ->name('password.reset');
    Route::post('reset-password', [AdminNewPasswordController::class, 'store'])
        ->name('password.update');
});

/* -------------------- ADMIN Panel (proteksi ensure_admin) -------------------- */
Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'ensure_admin'])
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

        Route::get('/technician-services/{technician_id}', [AdminTechnicianServiceController::class, 'show'])
            ->name('technician-services.show');

        Route::post('/technician-services/{technician_id}/toggle', [AdminTechnicianServiceController::class, 'toggle'])
            ->name('technician-services.toggle');

        Route::post('/technician-services/{technician_id}/activate-all', [AdminTechnicianServiceController::class, 'activateAll'])
            ->name('technician-services.activate-all');

        Route::post('/technician-services/{technician_id}/deactivate-all', [AdminTechnicianServiceController::class, 'deactivateAll'])
            ->name('technician-services.deactivate-all');

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

        Route::post('/payouts/{id}/approve', [AdminPayoutController::class, 'approve'])
            ->name('payouts.approve');

        Route::post('/payouts/{id}/reject', [AdminPayoutController::class, 'reject'])
            ->name('payouts.reject');

        Route::resource('balances', AdminBalanceController::class)
            ->only(['index'])
            ->parameters(['balances' => 'id']);

        Route::get('/balances/{role}/{id}', [AdminBalanceController::class, 'show'])
            ->where(['role' => 'user|teknisi', 'id' => '[0-9]+'])
            ->name('admin.balances.show');
    });


/* -------------------- Shortcut /dashboard -------------------- */
Route::get('/dashboard', function () {
    $user = Auth::user();
    if (!$user) {
        return redirect()->route('login.choice');
    }

    return match ($user->role) {
        'admin'   => redirect()->route('admin.dashboard'),
        'teknisi' => redirect()->route('teknisi.dashboard'),
        default   => redirect()->route('user.dashboard'),
    };
})->middleware('auth')->name('dashboard');
