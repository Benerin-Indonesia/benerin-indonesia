<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * GET /admin/categories
     * Props: categories (paginated), filters (q)
     */
    public function index(Request $request)
    {
        $filters = [
            'q' => $request->string('q')->toString(),
        ];

        $query = Category::query()
            ->when($filters['q'] !== '', function ($q) use ($filters) {
                $term = '%' . str_replace(' ', '%', $filters['q']) . '%';
                $q->where(function ($qq) use ($term) {
                    $qq->where('name', 'like', $term)
                       ->orWhere('slug', 'like', $term);
                });
            })
            ->orderBy('name');

        $categories = $query->paginate(20)->through(function (Category $c) {
            return [
                'id'   => $c->id,
                'slug' => $c->slug,
                'name' => $c->name,
                'icon' => $c->icon,
            ];
        });

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
            'filters'    => $filters,
        ]);
    }

    /**
     * POST /admin/categories
     */
    public function store(Request $request)
    {
        $rules = [
            'name' => ['required', 'string', 'max:100'],
            // slug boleh dikirim dari FE; jika kosong akan dibuat dari name
            'slug' => ['nullable', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:categories,slug'],
            'icon' => ['nullable', 'string', 'max:100'],
        ];

        $validated = $request->validate($rules);

        $slug = $validated['slug'] ?? '';
        if ($slug === '') {
            $slug = $this->makeSlug($validated['name']);
        } else {
            $slug = $this->makeSlug($slug); // normalisasi
        }

        // validasi unik ulang setelah normalisasi (jaga-jaga)
        if (Category::where('slug', $slug)->exists()) {
            return back()->withErrors(['slug' => 'Slug sudah digunakan.'])->withInput();
        }

        Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'icon' => $validated['icon'] ?? null,
        ]);

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    /**
     * PUT /admin/categories/{id}
     */
    public function update(Request $request, int $id)
    {
        $category = Category::findOrFail($id);

        $rules = [
            'name' => ['required', 'string', 'max:100'],
            'slug' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('categories', 'slug')->ignore($category->id),
            ],
            'icon' => ['nullable', 'string', 'max:100'],
        ];

        $validated = $request->validate($rules);

        // normalisasi slug
        $slug = $this->makeSlug($validated['slug']);

        // jika setelah normalisasi bertabrakan dengan kategori lain
        $dupe = Category::where('slug', $slug)->where('id', '!=', $category->id)->exists();
        if ($dupe) {
            return back()->withErrors(['slug' => 'Slug sudah digunakan di kategori lain.'])->withInput();
        }

        $category->update([
            'name' => $validated['name'],
            'slug' => $slug,
            'icon' => $validated['icon'] ?? null,
        ]);

        return back()->with('success', 'Perubahan kategori tersimpan.');
    }

    /**
     * DELETE /admin/categories/{id}
     */
    public function destroy(int $id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return back()->with('success', 'Kategori dihapus.');
    }

    /**
     * Buat/normalisasi slug: huruf kecil, strip, tanpa karakter aneh.
     */
    private function makeSlug(string $value): string
    {
        // Str::slug sudah mengubah spasi -> dash & lower-case
        // Batasi panjang sesuai validasi (max:100)
        return Str::slug(Str::limit($value, 100, ''));
    }
}
