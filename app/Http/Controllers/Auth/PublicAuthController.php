<?php
// app/Http/Controllers/Auth/PublicAuthController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class PublicAuthController extends Controller
{
    public function showLoginChoice()
    {
        return Inertia::render('auth/LoginChoice');
    }

    public function showRegisterChoice()
    {
        return Inertia::render('auth/RegisterChoice');
    }
}
