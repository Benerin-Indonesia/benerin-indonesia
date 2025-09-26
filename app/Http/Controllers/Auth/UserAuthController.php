<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserAuthController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('user/login'); // resources/js/Pages/user/login.tsx
    }

    public function login(Request $request)
    {
        $creds = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
            'remember' => ['nullable', 'boolean'],
        ]);

        // Pastikan hanya role 'user' yang bisa lewat form ini
        $ok = Auth::attempt(
            ['email' => $creds['email'], 'password' => $creds['password'], 'role' => 'user'],
            $request->boolean('remember')
        );

        if (! $ok) {
            return back()->withErrors(['email' => 'Kredensial tidak cocok atau peran tidak sesuai.'])->onlyInput('email');
        }

        $request->session()->regenerate();
        return redirect()->intended('/u/dashboard'); // ubah sesuai rute dashboard user
    }

    public function showRegisterForm()
    {
        return Inertia::render('user/register'); // resources/js/Pages/user/register.tsx
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'], // tambahkan 'confirmed' kalau di UI ada konfirmasi
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => 'user',
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended('/u/dashboard'); // ubah sesuai rute dashboard user
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
