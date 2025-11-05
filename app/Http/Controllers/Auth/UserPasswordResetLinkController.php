<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;

class UserPasswordResetLinkController extends Controller
{
    public function create()
    {
        return inertia('user/auth/ForgotPassword');
    }

    public function store(Request $request)
    {
        $request->validate(['email' => ['required','email']]);

        $status = Password::broker('users')->sendResetLink(
            $request->only('email')
        );

        return back()->with('status', __($status));
    }

    // === RESET PASSWORD ===

    // GET /user/reset-password/{token}
    public function createReset(Request $request, string $token)
    {
        return inertia('user/auth/ResetPassword', [
            'token' => $token,
            'email' => $request->query('email'), // dari link email
        ]);
    }

    // POST /user/reset-password
    public function updatePassword(Request $request)
    {
        $request->validate([
            'token'    => ['required'],
            'email'    => ['required','email'],
            'password' => ['required','confirmed','min:8'],
        ]);

        $status = Password::broker('users')->reset(
            $request->only('email','password','password_confirmation','token'),
            function ($user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->route('user.login.show')
                ->with('status', 'Password berhasil diperbarui. Silakan login.');
        }

        // kirim balik error (mis. token invalid/expired)
        return back()->withErrors(['email' => [__($status)]]);
    }
}
