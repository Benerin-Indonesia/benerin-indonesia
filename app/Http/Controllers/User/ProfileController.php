<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;


class ProfileController extends Controller
{
    /**
     * Menampilkan halaman edit profil.
     */
    public function index(Request $request)
    {
        // Mengambil seluruh data user yang sedang terotentikasi.
        $user = $request->user();

        // Merender komponen Inertia 'Profil/Index' dengan data user.
        return Inertia::render('user/profile', [
            // Prop 'userProfile' akan berisi semua data dari model User
            // untuk ditampilkan di frontend.
            'userProfile' => [
                'id'             => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'role'           => $user->role,
                'phone'          => $user->phone,
                // Menggunakan asset() untuk membuat URL lengkap ke foto profil.
                'photo_url'      => $user->photo ? asset('storage/' . $user->photo) : null,
                'bank_name'      => $user->bank_name,
                'account_name'   => $user->account_name,
                'account_number' => $user->account_number,
            ],
            'status' => session('status'), // Untuk notifikasi jika ada.
        ]);
    }

    /**
     * Mengupdate informasi profil pengguna.
     */
    public function update(Request $request)
    {
        // dd('hello');
        $user = $request->user();

        // 1. Validasi input
        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'email'          => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'          => ['nullable', 'string', 'regex:/^(0|\+62|62)\d{8,15}$/'],
            'bank_name'      => ['nullable', 'string', 'max:255'],
            'account_name'   => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'photo'          => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        // 2. Normalisasi / Cleansing Data
        $validated['name'] = Str::of($validated['name'])->squish()->title(); // Hilangkan spasi ganda, kapitalisasi tiap kata
        $validated['email'] = Str::lower($validated['email']); // Email selalu huruf kecil
        $validated['bank_name'] = $validated['bank_name'] ? Str::title(trim($validated['bank_name'])) : null;
        $validated['account_name'] = $validated['account_name'] ? Str::title(trim($validated['account_name'])) : null;
        $validated['account_number'] = $validated['account_number'] ? preg_replace('/\D/', '', $validated['account_number']) : null;

        // 3. Normalisasi nomor HP ke format internasional (E.164 tanpa '+')
        if (!empty($validated['phone'])) {
            $phone = preg_replace('/[^0-9]/', '', $validated['phone']); // hanya angka

            if (Str::startsWith($phone, '0')) {
                $phone = '62' . substr($phone, 1);
            } elseif (Str::startsWith($phone, '+62')) {
                $phone = substr($phone, 1);
            }

            $validated['phone'] = $phone;
        }

        // 4. Simpan foto baru (hapus lama jika ada)
        if ($request->hasFile('photo')) {
            if ($user->photo && Storage::disk('public')->exists($user->photo)) {
                Storage::disk('public')->delete($user->photo);
            }
            $validated['photo'] = $request->file('photo')->store('profile-photos', 'public');
        }

        // 5. Simpan perubahan user
        $user->fill($validated);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // 6. Redirect sukses
        return Redirect::route('user.profile.index')->with([
            'status'  => 'success',
            'message' => 'Profil berhasil diperbarui dan data telah dibersihkan.',
        ]);
    }
}
