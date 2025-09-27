<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\Auth\PublicAuthController;
use App\Http\Controllers\Auth\UserAuthController;
use App\Http\Controllers\Auth\TechnicianAuthController;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Admin\Auth\AdminPasswordResetLinkController;
use App\Http\Controllers\Admin\Auth\AdminNewPasswordController;

use App\Http\Controllers\ServiceRequest\ServiceRequestController;
use App\Http\Controllers\Teknisi\TechnicianController;

Route::get('/', [LandingPageController::class, 'index'])->name('home');

/* ===== Pilihan login/daftar umum ===== */
Route::get('/login', [PublicAuthController::class, 'showLoginChoice'])->name('login.choice');
Route::get('/register', [PublicAuthController::class, 'showRegisterChoice'])->name('register.choice');

/* ===== User (pengguna) ===== */
Route::prefix('user')->name('user.')->group(function () {
    // tamu
    Route::middleware('guest')->group(function () {
        Route::get('/login',    [UserAuthController::class, 'showLoginForm'])->name('login.show');
        Route::post('/login',   [UserAuthController::class, 'login'])->name('login');

        Route::get('/register', [UserAuthController::class, 'showRegisterForm'])->name('register.show');
        Route::post('/register', [UserAuthController::class, 'register'])->name('register');
    });

    // sudah login (role = user)
    Route::middleware('auth')->group(function () {
        Route::get('/dashboard', function () {
            if (!Auth::user() || Auth::user()->role !== 'user') {
                abort(403);
            }
            return Inertia::render('user/dashboard');
        })->name('dashboard');
    });
});

// Request Form Permintaan service oleh user
Route::get('/u/permintaan/buat', [ServiceRequestController::class, 'buatPermintaan'])->name('permintaan.create')->middleware('auth');
Route::post('/u/permintaan/simpan', [ServiceRequestController::class, 'store'])->name('permintaan.store')->middleware('auth');

/* ===== Teknisi ===== */
Route::prefix('teknisi')->name('teknisi.')->group(function () {
    // tamu
    Route::middleware('guest')->group(function () {
        Route::get('/login',    [TechnicianAuthController::class, 'showLoginForm'])->name('login.show');
        Route::post('/login',   [TechnicianAuthController::class, 'login'])->name('login');

        Route::get('/register', [TechnicianAuthController::class, 'showRegisterForm'])->name('register.show');
        Route::post('/register', [TechnicianAuthController::class, 'register'])->name('register');
    });

    // sudah login (role = teknisi)
    Route::middleware('auth')->group(function () {
        // Route::get('/dashboard', function () {
        //     if (!Auth::user() || Auth::user()->role !== 'teknisi') {
        //         abort(403);
        //     }
        //     return Inertia::render('teknisi/dashboard');
        // })->name('dashboard');

        Route::get('/dashboard', [TechnicianController::class, 'index'])->name('dashboard');
        Route::post('/toggle-activity', [TechnicianController::class, 'toggleAvailability'])
            ->name('toggle-availability');
    });
});

/* ===== Admin (login & lupa password) ===== */
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login',  [AdminAuthController::class, 'showLoginForm'])->name('login.show');
    Route::post('/login', [AdminAuthController::class, 'login'])->name('login');

    // forgot password (halaman yang ada)
    Route::get('/forgot-password', fn() => Inertia::render('admin/forgot-password'))
        ->name('password.request');
    Route::post('/forgot-password', [AdminPasswordResetLinkController::class, 'store'])
        ->name('password.email');

    // opsional: dashboard admin (role = admin)
    Route::middleware('auth')->get('/dashboard', function () {
        if (!Auth::user() || Auth::user()->role !== 'admin') {
            abort(403);
        }
        // pastikan ada resources/js/Pages/admin/dashboard.tsx jika ingin dipakai
        return Inertia::render('admin/dashboard');
    })->name('dashboard');

    // kamu belum punya halaman reset, jadi arahkan kembali ke forgot-password agar tidak 404
    Route::get('/reset-password/{token}', function (string $token) {
        return redirect()->route('admin.password.request')
            ->with('status', 'Tautan reset diterima. Silakan ikuti instruksi di email untuk menyetel ulang password.');
    })->name('password.reset');
});

/* ===== Shortcut /dashboard untuk auto-redirect berdasarkan role ===== */
Route::middleware('auth')->get('/dashboard', function () {
    $user = Auth::user();
    if (!$user) return redirect()->route('login.choice');

    return match ($user->role) {
        'teknisi' => redirect()->route('teknisi.dashboard'),
        'admin'   => redirect()->route('admin.dashboard'),
        default   => redirect()->route('user.dashboard'), // user
    };
})->name('dashboard');


// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');
// });

// require __DIR__.'/settings.php';
// require __DIR__.'/auth.php';
