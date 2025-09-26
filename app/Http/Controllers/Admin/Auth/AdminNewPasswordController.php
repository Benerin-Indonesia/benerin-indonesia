<?php

namespace App\Http\Controllers\Admin\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use App\Http\Controllers\Controller;

class AdminNewPasswordController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'token'    => ['required'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $status = Password::broker('admins')->reset(
            $validated,
            function ($user, $password) {
                // set password baru
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));

                // langsung login di guard admin
                Auth::guard('admin')->login($user);
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->intended('/admin/dashboard')
                ->with('status', __($status));
        }

        return back()->withErrors(['email' => __($status)]);
    }
}
