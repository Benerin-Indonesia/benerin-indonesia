<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        // belum login → arahkan ke halaman login admin
        if (!Auth::check()) {
            return redirect()->route('admin.login.show');
        }

        // bukan admin → 403
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Hanya admin yang boleh mengakses.');
        }

        return $next($request);
    }
}
