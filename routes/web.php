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
use App\Http\Controllers\Admin\UserController as AdminUserController;


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
        Route::post('/register',[UserAuthController::class, 'register'])->name('register');
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

/* ===== Teknisi ===== */
Route::prefix('teknisi')->name('teknisi.')->group(function () {
    // tamu
    Route::middleware('guest')->group(function () {
        Route::get('/login',    [TechnicianAuthController::class, 'showLoginForm'])->name('login.show');
        Route::post('/login',   [TechnicianAuthController::class, 'login'])->name('login');

        Route::get('/register', [TechnicianAuthController::class, 'showRegisterForm'])->name('register.show');
        Route::post('/register',[TechnicianAuthController::class, 'register'])->name('register');
    });

    // sudah login (role = teknisi)
    Route::middleware('auth')->group(function () {
        Route::get('/dashboard', function () {
            if (!Auth::user() || Auth::user()->role !== 'teknisi') {
                abort(403);
            }
            return Inertia::render('teknisi/dashboard');
        })->name('dashboard');
    });
});

/* ===== Admin (login & lupa password) ===== */
Route::prefix('admin')->name('admin.')->group(function () {
    // ====== Publik (tanpa login) ======
    Route::get('/login',  [App\Http\Controllers\Auth\AdminAuthController::class, 'showLoginForm'])->name('login.show');
    Route::post('/login', [App\Http\Controllers\Auth\AdminAuthController::class, 'login'])->name('login');

    Route::get('/forgot-password', fn () => Inertia::render('admin/forgot-password'))
        ->name('password.request');
    Route::post('/forgot-password', [App\Http\Controllers\Admin\Auth\AdminPasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('/reset-password/{token}', function (string $token) {
        return redirect()->route('admin.password.request')
            ->with('status', 'Tautan reset diterima. Silakan ikuti instruksi di email untuk menyetel ulang password.');
    })->name('password.reset');

    // ====== Panel Admin (sementara dummy) ======
    // NOTE: Kalau mau kunci akses, tambah 'auth' + cek role seperti sebelumnya.
    Route::middleware([
        // 'auth',
        // function ($request, \Closure $next) {
        //     if (!Auth::user() || Auth::user()->role !== 'admin') abort(403);
        //     return $next($request);
        // },
    ])->group(function () {

        // Dashboard (boleh kosong; halamanmu sudah ada fallback dummy)
        Route::get('/dashboard', fn () => Inertia::render('admin/dashboard'))->name('dashboard');

        // ==== DUMMY DATA HELPER ====
        $fakeUsers = function () {
            return [
                ['id' => 1, 'name' => 'Admin Satu',   'email' => 'admin@example.com',   'role' => 'admin',    'phone' => '081234567890'],
                ['id' => 2, 'name' => 'Budi',         'email' => 'budi@example.com',    'role' => 'user',     'phone' => '081111111111'],
                ['id' => 3, 'name' => 'Sari',         'email' => 'sari@example.com',    'role' => 'user',     'phone' => '082222222222'],
                ['id' => 4, 'name' => 'Tekno Jaya',   'email' => 'tekno@example.com',   'role' => 'teknisi',  'phone' => '083333333333'],
                ['id' => 5, 'name' => 'Rama Service', 'email' => 'rama@example.com',    'role' => 'teknisi',  'phone' => '084444444444'],
            ];
        };

        // ===== Users Index (LIST) =====
        Route::get('/users', function () use ($fakeUsers) {
            // ambil filter dari query (dummy; tidak benar-benar mem-filter data)
            $filters = request()->only('q', 'role');

            // kirim seluruh data dummy ke FE
            return Inertia::render('admin/users/index', [
                'users'   => $fakeUsers(),
                'filters' => $filters,
            ]);
        })->name('users.index');

        // ===== Users Create (FORM) =====
        Route::get('/users/create', function () {
            return Inertia::render('admin/users/create', [
                'roles' => ['user', 'teknisi', 'admin'], // untuk dropdown di form
            ]);
        })->name('users.create');

        // ===== Users Store (SUBMIT) =====
        Route::post('/users', function () {
            // Di dummy mode, kita tidak simpan ke DB. Anggap sukses.
            // Kamu bisa validasi ringan jika mau.
            return redirect()->route('admin.users.index')
                ->with('status', 'User berhasil dibuat (dummy).');
        })->name('users.store');

        // ===== Users Edit (FORM) =====
        Route::get('/users/{id}/edit', function ($id) use ($fakeUsers) {
            $user = collect($fakeUsers())->firstWhere('id', (int) $id);
            if (!$user) {
                abort(404, 'User dummy tidak ditemukan.');
            }
            return Inertia::render('admin/users/edit', [
                'user'  => $user,
                'roles' => ['user', 'teknisi', 'admin'],
            ]);
        })->name('users.edit');

        // ===== Users Update (SUBMIT) =====
        Route::put('/users/{id}', function ($id) {
            // Dummy: anggap sukses update
            return redirect()->route('admin.users.index')
                ->with('status', "User #{$id} berhasil diperbarui (dummy).");
        })->name('users.update');

        // ===== Users Destroy (DELETE) =====
        Route::delete('/users/{id}', function ($id) {
            // Dummy: anggap sukses hapus
            return redirect()->route('admin.users.index')
                ->with('status', "User #{$id} berhasil dihapus (dummy).");
        })->name('users.destroy');
    });
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
