<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TechnicianService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class TechnicianServiceController extends Controller
{
    /**
     * GET /admin/technician-services
     * Props yang dikirim: services (paginated), technicians (dropdown), categories (dropdown), filters.
     */
    public function index(Request $request)
    {
        $filters = [
            'q'        => $request->string('q')->toString(),
            'category' => $request->string('category')->toString(),
            'active'   => $request->filled('active') ? $request->string('active')->toString() : '',
        ];

        $query = TechnicianService::query()
            ->with(['technician:id,name,email,phone'])
            ->when($filters['q'] !== '', function ($q) use ($filters) {
                $term = '%' . str_replace(' ', '%', $filters['q']) . '%';
                $q->whereHas('technician', function ($t) use ($term) {
                    $t->where('name', 'like', $term)
                      ->orWhere('email', 'like', $term);
                });
            })
            ->when($filters['category'] !== '', fn ($q) => $q->where('category', $filters['category']))
            ->when($filters['active'] !== '', function ($q) use ($filters) {
                // '1' -> true, '0' -> false
                $q->where('active', $filters['active'] === '1');
            })
            ->orderByDesc('id');

        // Paginate ringan; frontend siap menelan { data: [] }
        $services = $query->paginate(20)->through(function (TechnicianService $s) {
            return [
                'id'             => $s->id,
                'technician_id'  => $s->technician_id,
                'category'       => $s->category,
                'active'         => (bool) $s->active,
                'technician'     => $s->technician
                    ? [
                        'id'    => $s->technician->id,
                        'name'  => $s->technician->name,
                        'email' => $s->technician->email,
                        'phone' => $s->technician->phone,
                    ]
                    : null,
            ];
        });

        // Dropdown teknisi (hanya role=teknisi)
        $technicians = User::query()
            ->where('role', 'teknisi')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        // Dropdown kategori (dari tabel categories kalau ada; fallback ke defaults)
        $categories = $this->loadCategories();

        return Inertia::render('admin/technician-services/index', [
            'services'    => $services,
            'technicians' => $technicians,
            'categories'  => $categories,
            'filters'     => $filters,
        ]);
    }

    /**
     * POST /admin/technician-services
     */
    public function store(Request $request)
    {
        $rules = [
            'technician_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where('role', 'teknisi'),
            ],
            'category' => $this->categoryRule(),
            'active'   => ['nullable', 'boolean'],
        ];

        $validated = $request->validate($rules);

        // Pastikan unik (technician_id, category)
        $exists = TechnicianService::query()
            ->where('technician_id', $validated['technician_id'])
            ->where('category', $validated['category'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'category' => 'Layanan untuk teknisi & kategori tersebut sudah ada.',
            ])->withInput();
        }

        TechnicianService::create([
            'technician_id' => $validated['technician_id'],
            'category'      => $validated['category'],
            'active'        => (bool) ($validated['active'] ?? true),
        ]);

        return back()->with('success', 'Layanan teknisi berhasil ditambahkan.');
    }

    /**
     * PUT /admin/technician-services/{id}
     */
    public function update(Request $request, int $id)
    {
        $service = TechnicianService::findOrFail($id);

        $rules = [
            'technician_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where('role', 'teknisi'),
            ],
            'category' => $this->categoryRule(),
            'active'   => ['required', 'boolean'],
        ];

        $validated = $request->validate($rules);

        // Cek duplikat kombinasi (technician_id, category) milik record lain
        $duplicate = TechnicianService::query()
            ->where('technician_id', $validated['technician_id'])
            ->where('category', $validated['category'])
            ->where('id', '!=', $service->id)
            ->exists();

        if ($duplicate) {
            return back()->withErrors([
                'category' => 'Kombinasi teknisi & kategori sudah digunakan di record lain.',
            ])->withInput();
        }

        $service->update([
            'technician_id' => $validated['technician_id'],
            'category'      => $validated['category'],
            'active'        => (bool) $validated['active'],
        ]);

        return back()->with('success', 'Perubahan tersimpan.');
    }

    /**
     * DELETE /admin/technician-services/{id}
     */
    public function destroy(int $id)
    {
        $service = TechnicianService::findOrFail($id);
        $service->delete();

        return back()->with('success', 'Layanan teknisi dihapus.');
    }

    /**
     * Validasi kategori:
     * - Jika tabel categories ada, pastikan slug ada.
     * - Jika tidak ada, minimal string slug.
     */
    private function categoryRule()
    {
        if (Schema::hasTable('categories')) {
            return [
                'required',
                'string',
                Rule::exists('categories', 'slug'),
            ];
        }
        return ['required', 'string', 'max:100']; // fallback sederhana
    }

    /**
     * Ambil daftar kategori: slug & name.
     * Fallback ke defaults jika tabel categories tidak tersedia.
     */
    private function loadCategories(): array
    {
        if (Schema::hasTable('categories')) {
            return DB::table('categories')
                ->orderBy('name')
                ->get(['slug', 'name'])
                ->map(fn ($r) => ['slug' => $r->slug, 'name' => $r->name])
                ->toArray();
        }

        // Fallback sesuai yang sudah dipakai di FE
        return [
            ['slug' => 'ac',         'name' => 'AC'],
            ['slug' => 'tv',         'name' => 'TV'],
            ['slug' => 'kulkas',     'name' => 'Kulkas'],
            ['slug' => 'mesin-cuci', 'name' => 'Mesin Cuci'],
        ];
    }
}
