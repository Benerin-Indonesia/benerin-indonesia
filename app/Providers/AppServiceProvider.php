<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Auth\Notifications\ResetPassword;
use Midtrans\Config as Midtrans;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Midtrans init dari config (.env)
        Midtrans::$serverKey    = (string) config('services.midtrans.server_key');
        Midtrans::$isProduction = (bool)   config('services.midtrans.is_production');
        Midtrans::$isSanitized  = (bool)  (config('services.midtrans.is_sanitized') ?? true);
        Midtrans::$is3ds        = (bool)   config('services.midtrans.is_3ds');

        // Share auth ke Inertia
        Inertia::share('auth', function () {
            $user = Auth::user();
            return [
                'user' => $user ? [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                    'photo' => $user->photo,
                ] : null,
            ];
        });

        // Reset password URL berdasar role
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $email = $notifiable->getEmailForPasswordReset();
            $role  = data_get($notifiable, 'role');
            return match ($role) {
                'admin'   => url(route('admin.password.reset',   ['token' => $token, 'email' => $email], false)),
                'teknisi' => url(route('teknisi.password.reset', ['token' => $token, 'email' => $email], false)),
                default   => url(route('user.password.reset',    ['token' => $token, 'email' => $email], false)),
            };
        });
    }
}
