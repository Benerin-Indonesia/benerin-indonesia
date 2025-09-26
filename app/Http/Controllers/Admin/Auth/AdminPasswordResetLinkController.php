<?php

namespace App\Http\Controllers\Admin\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use App\Http\Controllers\Controller;

class AdminPasswordResetLinkController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        // Pastikan broker "admins" ada di config/auth.php (passwords)
        $status = Password::broker('admins')->sendResetLink([
            'email' => $validated['email'],
        ]);

        if ($status === Password::RESET_LINK_SENT) {
            // Inertia akan dapat flash('status')
            return back()->with('status', __($status));
        }

        return back()->withErrors(['email' => __($status)]);
    }
}
