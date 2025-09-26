<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class TechnicianAuthController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('teknisi/login'); // resources/js/Pages/teknisi/login.tsx
    }

    public function login(Request $request)
    {
        $creds = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $ok = Auth::attempt(
            ['email' => $creds['email'], 'password' => $creds['password'], 'role' => 'teknisi'],
            $request->boolean('remember')
        );

        if (! $ok) {
            return back()->withErrors(['email' => 'Kredensial tidak cocok atau peran tidak sesuai.'])->onlyInput('email');
        }

        $request->session()->regenerate();
        return redirect()->intended('/teknisi/dashboard'); // ubah sesuai rute dashboard teknisi
    }

    public function showRegisterForm()
    {
        return Inertia::render('teknisi/register'); // resources/js/Pages/teknisi/register.tsx
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => 'teknisi',
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended('/teknisi/dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
