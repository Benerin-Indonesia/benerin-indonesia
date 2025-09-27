<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class userController extends Controller
{
    function index()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'user') abort(403);

        return Inertia::render('user/dashboard');
    }
}
