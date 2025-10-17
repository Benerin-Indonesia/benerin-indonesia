<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * GET /admin/categories
     * Props: categories (paginated), filters (q, perPage)
     */
public function index(Request $request)
{
    // ambil filter
    $filters = [
        'q'       => $request->string('q')->toString(),
        'perPage' => (int) $request->input('perPage', 10),
    ];

    // batasi pilihan per halaman
    $allowedPerPage = [10, 20, 50, 100];
    $perPage = in_array($filters['perPage'], $allowedPerPage, true) ? $filters['perPage'] : 10;

    $query = Category::query()
        ->when($filters['q'] !== '', function ($q) use ($filters) {
            $term = '%' . str_replace(' ', '%', $filters['q']) . '%';
            $q->where(function ($qq) use ($term) {
                $qq->where('name', 'like', $term)
                   ->orWhere('slug', 'like', $term);
            });
        })
        ->orderBy('name');

    // penting: pakai paginate (BUKAN get), dan withQueryString agar q/perPage ikut di link
    $categories = $query->paginate($perPage)
        ->withQueryString()
        ->through(function (Category $c) {
            return [
                'id'   => $c->id,
                'slug' => $c->slug,
                'name' => $c->name,
                'icon' => $c->icon,
            ];
        });

    return Inertia::render('admin/categories/index', [
        'categories' => $categories,             // paginator utuh (ada current_page, last_page, per_page, total, dst.)
        'filters'    => [
            'q'       => $filters['q'],
            'perPage' => $perPage,
        ],
    ]);
}


    /**
     * POST /admin/categories
     * - Upload ikon (wajib) → simpan ke disk 'public' (storage/app/public/categories)
     * - Simpan path ke kolom 'icon'
     */
    public function store(Request $request)
    {
        $messages = [
            'photo.max'   => 'Ukuran file melebihi 2 MB. Mohon jangan melebihi batas upload.',
            'photo.image' => 'Berkas harus berupa gambar.',
            'photo.mimes' => 'Format gambar tidak didukung. Gunakan JPG/PNG/WEBP.',
        ];

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:100'],
            'slug'  => ['nullable', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:categories,slug'],
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'], // 2MB
        ], $messages);

        // Normalisasi slug
        $slug = $validated['slug'] ?? '';
        $slug = $slug === '' ? $this->makeSlug($validated['name']) : $this->makeSlug($slug);

        // Cek unik lagi setelah normalisasi
        if (Category::where('slug', $slug)->exists()) {
            return back()->withErrors(['slug' => 'Slug sudah digunakan.'])->withInput();
        }

        // Simpan file
        $path = $request->file('photo')->store('categories', 'public');

        Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'icon' => $path,
        ]);

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    /**
     * PUT /admin/categories/{id}
     * - Ganti ikon jika ada upload baru (hapus file lama)
     * - Jika tidak ada upload, ikon tetap.
     */
    public function update(Request $request, int $id)
    {
        $category = Category::findOrFail($id);

        $messages = [
            'photo.max'   => 'Ukuran file melebihi 2 MB. Mohon jangan melebihi batas upload.',
            'photo.image' => 'Berkas harus berupa gambar.',
            'photo.mimes' => 'Format gambar tidak didukung. Gunakan JPG/PNG/WEBP.',
        ];

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:100'],
            'slug'  => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('categories', 'slug')->ignore($category->id),
            ],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'], // 2MB
        ], $messages);

        // Normalisasi slug dan pastikan unik pasca normalisasi
        $slug = $this->makeSlug($validated['slug']);
        $dupe = Category::where('slug', $slug)->where('id', '!=', $category->id)->exists();
        if ($dupe) {
            return back()->withErrors(['slug' => 'Slug sudah digunakan di kategori lain.'])->withInput();
        }

        // Jika ada file baru → hapus lama & simpan baru
        if ($request->hasFile('photo')) {
            if ($category->icon && Storage::disk('public')->exists($category->icon)) {
                Storage::disk('public')->delete($category->icon);
            }
            $path = $request->file('photo')->store('categories', 'public');
            $category->icon = $path;
        }

        $category->name = $validated['name'];
        $category->slug = $slug;
        $category->save();

        return back()->with('success', 'Perubahan kategori tersimpan.');
    }

    /**
     * DELETE /admin/categories/{id}
     * - Hapus file ikon di storage (jika ada)
     */
    public function destroy(int $id)
    {
        $category = Category::findOrFail($id);

        if ($category->icon && Storage::disk('public')->exists($category->icon)) {
            Storage::disk('public')->delete($category->icon);
        }

        $category->delete();

        return back()->with('success', 'Kategori dihapus.');
    }

    /**
     * Buat/normalisasi slug: huruf kecil, strip, tanpa karakter aneh.
     */
    private function makeSlug(string $value): string
    {
        return Str::slug(Str::limit($value, 100, ''));
    }
}
