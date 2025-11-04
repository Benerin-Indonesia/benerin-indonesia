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
            ->when($filters['category'] !== '', fn($q) => $q->where('category', $filters['category']))
            ->when($filters['active'] !== '', function ($q) use ($filters) {
                $q->where('active', $filters['active'] === '1');
            })
            ->orderByDesc('id');

        $perPage = max(1, min(100, (int) $request->input('perPage', 10)));

        $services = $query
            ->paginate($perPage)
            ->through(function ($s) {
                return [
                    'id' => $s->id,
                    'technician_id' => $s->technician_id,
                    'category' => $s->category,
                    'active' => (bool) $s->active,
                    'technician' => $s->technician ? [
                        'id' => $s->technician->id,
                        'name' => $s->technician->name,
                        'email' => $s->technician->email,
                        'phone' => $s->technician->phone,
                    ] : null,
                ];
            });

        $technicians = User::where('role', 'teknisi')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone']);

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
        $validated = $request->validate([
            'technician_id' => ['required', 'integer', Rule::exists('users', 'id')->where('role', 'teknisi')],
            'category'      => $this->categoryRule(),
            'active'        => ['nullable', 'boolean'],
        ]);

        $exists = TechnicianService::where('technician_id', $validated['technician_id'])
            ->where('category', $validated['category'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'category' => 'Layanan teknisi & kategori ini sudah ada.',
            ])->withInput();
        }

        TechnicianService::create([
            'technician_id' => $validated['technician_id'],
            'category' => $validated['category'],
            'active' => (bool) ($validated['active'] ?? true),
        ]);

        return back()->with('success', 'Layanan berhasil ditambahkan.');
    }

    /**
     * PUT /admin/technician-services/{id}
     */
    public function update(Request $request, int $id)
    {
        $service = TechnicianService::findOrFail($id);

        $validated = $request->validate([
            'technician_id' => ['required', 'integer', Rule::exists('users', 'id')->where('role', 'teknisi')],
            'category'      => $this->categoryRule(),
            'active'        => ['required', 'boolean'],
        ]);

        $duplicate = TechnicianService::where('technician_id', $validated['technician_id'])
            ->where('category', $validated['category'])
            ->where('id', '!=', $service->id)
            ->exists();

        if ($duplicate) {
            return back()->withErrors([
                'category' => 'Layanan teknisi & kategori ini sudah digunakan sebelumnya.',
            ])->withInput();
        }

        $service->update($validated);

        return back()->with('success', 'Perubahan disimpan.');
    }

    /**
     * DELETE /admin/technician-services/{id}
     */
    public function destroy(int $id)
    {
        TechnicianService::findOrFail($id)->delete();
        return back()->with('success', 'Layanan berhasil dihapus.');
    }

    /**
     * GET /admin/technician-services/{technician_id}
     */
    public function show(int $technician_id)
    {
        $owner = User::where('role', 'teknisi')->findOrFail($technician_id);

        $services = TechnicianService::where('technician_id', $technician_id)
            ->get(['id', 'technician_id', 'category', 'active']);

        $categories = $this->loadCategories();

        return Inertia::render('admin/technician-services/show', [
            'owner' => [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
                'phone' => $owner->phone,
            ],
            'services' => $services,
            'categories' => $categories,
        ]);
    }

    /**
     * POST /admin/technician-services/{technician_id}/toggle
     */
    public function toggle(Request $request, int $technician_id)
    {
        $request->validate([
            'category' => $this->categoryRule(),
        ]);

        $service = TechnicianService::firstOrCreate(
            ['technician_id' => $technician_id, 'category' => $request->category],
            ['active' => false]
        );

        $service->active = !$service->active;
        $service->save();

        return back()->with('success', 'Status layanan diperbarui.');
    }

    public function activateAll(int $technician_id)
    {
        $slugs = array_column($this->loadCategories(), 'slug');

        foreach ($slugs as $slug) {
            TechnicianService::updateOrCreate(
                ['technician_id' => $technician_id, 'category' => $slug],
                ['active' => true]
            );
        }

        return back()->with('success', 'Semua layanan diaktifkan.');
    }

    public function deactivateAll(int $technician_id)
    {
        TechnicianService::where('technician_id', $technician_id)->update(['active' => false]);

        return back()->with('success', 'Semua layanan dinonaktifkan.');
    }

    private function categoryRule()
    {
        if (Schema::hasTable('categories')) {
            return ['required', 'string', Rule::exists('categories', 'slug')];
        }
        return ['required', 'string', 'max:100'];
    }

    private function loadCategories(): array
    {
        if (Schema::hasTable('categories')) {
            return DB::table('categories')
                ->orderBy('name')
                ->get(['slug', 'name', 'icon']) // ✅ ambil icon
                ->map(fn($r) => [
                    'slug' => $r->slug,
                    'name' => $r->name,
                    'icon' => $r->icon, // ✅ kirim ke FE
                ])
                ->toArray();
        }

        return [
            ['slug' => 'ac', 'name' => 'AC', 'icon' => 'assets/categories/ac.png'],
            ['slug' => 'tv', 'name' => 'TV', 'icon' => 'assets/categories/tv.png'],
            ['slug' => 'kulkas', 'name' => 'Kulkas', 'icon' => 'assets/categories/kulkas.png'],
            ['slug' => 'mesin-cuci', 'name' => 'Mesin Cuci', 'icon' => 'assets/categories/mesin-cuci.png'],
        ];
    }
}
