<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function buatPermintaan(Request $request)
    {
        $category = $request->query('category', '');

        return Inertia::render('user/form/index', [
            'initialCategory' => $category,
        ]);
    }
}
