<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle($request, Closure $next, $role)
    {
        // 🔒 Jika session habis / user belum login
        if (!Auth::check()) {
            // Jika request datang dari Inertia (SPA)
            if ($request->header('X-Inertia')) {
                return Inertia::render('Auth/Login', [
                    'flash' => ['message' => 'Sesi Anda telah berakhir. Silakan login kembali.']
                ])->toResponse($request);
            }

            // Jika bukan request Inertia (misalnya langsung buka URL)
            return redirect()->route('login.choice')->withErrors([
                'auth' => 'Sesi Anda telah berakhir. Silakan login kembali.'
            ]);
        }

        // 🔑 Jika role tidak sesuai
        if (Auth::user()->role !== $role) {
            abort(403, 'Unauthorized.');
        }

        // ✅ Semua aman
        return $next($request);
    }
}
