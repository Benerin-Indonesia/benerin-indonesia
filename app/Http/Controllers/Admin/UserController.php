<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * GET /admin/users
     * List + filter (q, role). Return paginate agar FE bisa pakai { data: [] }.
     */
    public function index(Request $request)
    {
        $q    = (string) $request->query('q', '');
        $role = (string) $request->query('role', '');

        // Normalize FE's "technician" -> DB enum "teknisi"
        if ($role === 'technician') {
            $role = 'teknisi';
        }

        $users = User::query()
            ->when($q !== '', function ($qr) use ($q) {
                $qr->where(function ($w) use ($q) {
                    $w->where('name', 'like', "%{$q}%")
                      ->orWhere('email', 'like', "%{$q}%");
                });
            })
            ->when($role !== '', fn ($qr) => $qr->where('role', $role))
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users'   => $users,            // FE kamu sudah support { data: [] } atau array
            'filters' => ['q' => $q, 'role' => $request->query('role', '')],
        ]);
    }

    /**
     * GET /admin/users/create
     */
    public function create()
    {
        return Inertia::render('admin/users/create', [
            // enum DB: user|teknisi|admin
            'roles' => ['user', 'teknisi', 'admin'],
        ]);
    }

    /**
     * POST /admin/users
     */
    public function store(Request $request)
    {
        // Normalize role
        $role = $request->input('role');
        if ($role === 'technician') {
            $request->merge(['role' => 'teknisi']);
        }

        $validated = $request->validate([
            'name'     => ['required','string','max:255'],
            'email'    => ['required','email','max:255','unique:users,email'],
            'password' => ['required','string','min:8'],
            'role'     => ['required', Rule::in(['user','teknisi','admin'])],
            'phone'           => ['nullable','string','max:30'],
            'bank_name'       => ['nullable','string','max:100'],
            'account_name'    => ['nullable','string','max:100'],
            'account_number'  => ['nullable','string','max:100'],
        ]);

        $user = new User();
        $user->name     = $validated['name'];
        $user->email    = $validated['email'];
        $user->password = Hash::make($validated['password']);
        $user->role     = $validated['role'];
        $user->phone    = $request->input('phone');
        $user->bank_name      = $request->input('bank_name');
        $user->account_name   = $request->input('account_name');
        $user->account_number = $request->input('account_number');
        $user->save();

        return redirect()->route('admin.users.index')->with('status', 'User berhasil dibuat.');
    }

    /**
     * GET /admin/users/{id}/edit
     */
    public function edit(int $id)
    {
        $user = User::findOrFail($id);

        return Inertia::render('admin/users/edit', [
            'user'  => $user,
            'roles' => ['user', 'teknisi', 'admin'],
        ]);
    }

    /**
     * PUT /admin/users/{id}
     */
    public function update(Request $request, int $id)
    {
        // Normalize role
        $role = $request->input('role');
        if ($role === 'technician') {
            $request->merge(['role' => 'teknisi']);
        }

        $validated = $request->validate([
            'name'  => ['required','string','max:255'],
            'email' => ['required','email','max:255', Rule::unique('users','email')->ignore($id)],
            'role'  => ['required', Rule::in(['user','teknisi','admin'])],
            'password'       => ['nullable','string','min:8'],
            'phone'          => ['nullable','string','max:30'],
            'bank_name'      => ['nullable','string','max:100'],
            'account_name'   => ['nullable','string','max:100'],
            'account_number' => ['nullable','string','max:100'],
        ]);

        $user = User::findOrFail($id);
        $user->name   = $validated['name'];
        $user->email  = $validated['email'];
        $user->role   = $validated['role'];
        $user->phone  = $request->input('phone');

        $user->bank_name      = $request->input('bank_name');
        $user->account_name   = $request->input('account_name');
        $user->account_number = $request->input('account_number');

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()->route('admin.users.index')->with('status', 'User berhasil diperbarui.');
    }

    /**
     * DELETE /admin/users/{id}
     */
    public function destroy(int $id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return redirect()->route('admin.users.index')->with('status', 'User berhasil dihapus.');
    }
}
