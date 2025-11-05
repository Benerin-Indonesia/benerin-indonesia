<?php

namespace App\Http\Controllers\Teknisi;

use App\Http\Controllers\Controller;
use App\Models\Balance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Payout;
use Illuminate\Support\Facades\DB;

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
        return Inertia::render('teknisi/profile', [
            'userProfile' => [
                'id'             => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'role'           => $user->role,
                'phone'          => $user->phone,
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
        return Redirect::route('teknisi.profile')->with([
            'status'  => 'success',
            'message' => 'Profil berhasil diperbarui dan data telah dibersihkan.',
        ]);
    }

    /**
     * Menampilkan data wallet
     */
    public function walletIndex(Request $request)
    {
        $user = $request->user();

        $totalBalance = Balance::where('owner_id', $user->id)
            ->whereIn('type', ['escrow_release', 'paid', 'payout_request'])
            ->sum('amount');
        // dd($totalBalance);

        return Inertia::render('teknisi/wallet', [
            'totalBalance' => $totalBalance,
            'userProfile' => [
                'name'           => $user->name,
                'bank_name'      => $user->bank_name,
                'account_name'   => $user->account_name,
                'account_number' => $user->account_number,
            ],
        ]);
    }

    /**
     * Tarik Tunai form
     */
    public function walletWithdrawCreate(Request $request)
    {
        $user = $request->user();

        $totalBalance = Balance::where('owner_id', $user->id)
            ->whereIn('type', ['escrow_release', 'paid', 'payout_request'])
            ->sum('amount');

        return Inertia::render('teknisi/payout-form', [
            'totalBalance' => $totalBalance,
            'userProfile' => [
                'name'           => $user->name,
                'bank_name'      => $user->bank_name,
                'account_name'   => $user->account_name,
                'account_number' => $user->account_number,
            ],
        ]);
    }

    /**
     * Tarik Tunai
     */
    public function walletWithdrawStore(Request $request)
    {
        $user = Auth::user();

        // Hitung kembali saldo saat ini untuk validasi
        $currentBalance = Balance::where('owner_id', $user->id)
            ->whereIn('type', ['escrow_release', 'paid', 'payouts'])
            ->sum('amount');

        // Validasi: jumlah tidak boleh melebihi saldo dan rekening harus terisi
        $request->validate([
            'amount' => "required|numeric|min:10000|max:{$currentBalance}", // Minimal penarikan 10rb
        ], [
            'amount.max' => 'Jumlah penarikan tidak boleh melebihi saldo yang tersedia.',
            'amount.min' => 'Jumlah penarikan minimal adalah Rp 10.000.',
        ]);

        if (!$user->bank_name || !$user->account_name || !$user->account_number) {
            return back()->withErrors(['bank' => 'Harap lengkapi informasi rekening bank di profil Anda sebelum melakukan pencairan.']);
        }

        $payoutAmount = $request->input('amount');

        // Gunakan transaksi database untuk keamanan
        DB::transaction(function () use ($user, $payoutAmount) {
            // 1. Buat record di tabel 'payouts'
            $payout = Payout::create([
                'technician_id'  => $user->id,
                'amount'         => $payoutAmount,
                'status'         => 'pending',
                // Ambil snapshot data bank dari profil user saat ini
                'bank_name'      => $user->bank_name,
                'account_name'   => $user->account_name,
                'account_number' => $user->account_number,
            ]);

            // 2. Buat record di tabel 'balances' sebagai pengurang saldo
            Balance::create([
                'owner_id'   => $user->id,
                'owner_role' => 'technician',
                'amount'     => -$payoutAmount, // <-- Jumlahnya negatif karena mengurangi saldo
                'type'       => 'payout_request',
                'ref_table'  => 'payout',
                'ref_id'     => $payout->id,
                'note'       => 'Pengajuan pencairan dana #' . $payout->id,
            ]);
        });

        return redirect()->route('teknisi.payout.index');
    }
}