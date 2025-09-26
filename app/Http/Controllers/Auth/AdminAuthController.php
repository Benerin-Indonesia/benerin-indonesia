<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class AdminAuthController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('admin/login'); // resources/js/Pages/admin/login.tsx
    }

    public function login(Request $request)
    {
        $creds = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $ok = Auth::attempt(
            ['email' => $creds['email'], 'password' => $creds['password'], 'role' => 'admin'],
            $request->boolean('remember')
        );

        if (! $ok) {
            return back()->withErrors(['email' => 'Kredensial tidak cocok atau peran tidak sesuai.'])->onlyInput('email');
        }

        $request->session()->regenerate();
        return redirect()->intended('/admin/dashboard'); // ubah sesuai rute dashboard admin
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
