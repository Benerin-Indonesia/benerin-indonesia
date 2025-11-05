<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class TeknisiPasswordResetLinkController extends Controller
{
    /**
     * Tampilkan form lupa password teknisi
     * GET /teknisi/forgot-password
     */
    public function create()
    {
        return inertia('teknisi/auth/ForgotPassword');
    }

    /**
     * Kirim email reset password teknisi
     * POST /teknisi/forgot-password
     */
    public function store(Request $request)
    {
        $request->validate(['email' => ['required','email']]);

        $status = Password::broker('users')->sendResetLink(
            $request->only('email')
        );

        // Pesan generik agar tidak bocorkan eksistensi email
        return back()->with('status', __($status));
    }

    /**
     * Tampilkan form reset password teknisi
     * GET /teknisi/reset-password/{token}
     */
    public function createReset(Request $request, string $token)
    {
        return inertia('teknisi/auth/ResetPassword', [
            'token' => $token,
            'email' => $request->query('email'),
        ]);
    }

    /**
     * Simpan password baru teknisi
     * POST /teknisi/reset-password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'token'    => ['required'],
            'email'    => ['required','email'],
            'password' => ['required','confirmed', PasswordRule::defaults()], // atau 'min:8'
        ]);

        $status = Password::broker('users')->reset(
            $request->only('email','password','password_confirmation','token'),
            function ($user) use ($request) {
                $user->forceFill([
                    'password'       => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            // Redirect ke login TEKNISI + flash status (agar toast muncul)
            return redirect()->route('teknisi.login.show')
                ->with('status', 'Password berhasil diperbarui. Silakan login.');
        }

        // Token invalid/expired, dsb.
        return back()->withErrors(['email' => [__($status)]]);
    }
}
