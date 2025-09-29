<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'AC',
                'slug' => 'ac',
                'hint' => 'Perbaikan dan perawatan AC segala merk dan tipe',
                'icon' => 'fas fa-wind',
            ],
            [
                'name' => 'Kulkas',
                'slug' => 'kulkas',
                'hint' => 'Servis kulkas 1 pintu, 2 pintu, dan freezer',
                'icon' => 'fas fa-snowflake',
            ],
            [
                'name' => 'TV',
                'slug' => 'tv',
                'hint' => 'Perbaikan TV LED, LCD, Plasma, atau Smart TV',
                'icon' => 'fas fa-tv',
            ],
            [
                'name' => 'Mesin Cuci',
                'slug' => 'mesin-cuci',
                'hint' => 'Servis mesin cuci top loading, front loading, otomatis/manual',
                'icon' => 'fas fa-water',
            ],
            [
                'name' => 'Listrik',
                'slug' => 'listrik',
                'hint' => 'Instalasi listrik, perbaikan kabel, dan panel listrik',
                'icon' => 'fas fa-bolt',
            ],
            [
                'name' => 'Pipa & Saluran Air',
                'slug' => 'plumbing',
                'hint' => 'Perbaikan kebocoran pipa, wastafel, kloset, saluran mampet',
                'icon' => 'fas fa-faucet',
            ],
            [
                'name' => 'Peralatan Dapur',
                'slug' => 'peralatan-dapur',
                'hint' => 'Servis kompor gas, oven, blender, dan peralatan dapur lainnya',
                'icon' => 'fas fa-utensils',
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']], // kalau slug sudah ada, update saja
                $category
            );
        }
    }
}
