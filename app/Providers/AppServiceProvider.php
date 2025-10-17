<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Auth\Notifications\ResetPassword;

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

        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            // arahkan ke halaman reset password versi admin
            return url(route('admin.password.reset', ['token' => $token, 'email' => $notifiable->getEmailForPasswordReset()], false));
        });
    }
}
