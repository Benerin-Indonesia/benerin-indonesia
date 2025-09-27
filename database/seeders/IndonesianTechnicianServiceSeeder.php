<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\TechnicianService;
use Illuminate\Support\Facades\Schema;
use Faker\Factory as Faker;

class IndonesianTechnicianServiceSeeder extends Seeder
{
    public function run()
    {
        Schema::disableForeignKeyConstraints();
        TechnicianService::truncate();
        Schema::enableForeignKeyConstraints();

        $faker = Faker::create('id_ID');

        // Ambil semua user yang memiliki role 'teknisi'
        $technicians = User::where('role', 'teknisi')->get();

        if ($technicians->isEmpty()) {
            $this->command->error('Tidak ada user dengan role "teknisi" ditemukan. Harap jalankan IndonesianUserSeeder terlebih dahulu.');
            return;
        }

        $this->command->info('Menetapkan layanan untuk ' . $technicians->count() . ' teknisi...');

        $categories = [
            'ac',
            'kulkas',
            'tv',
            'mesin-cuci',
        ];

        foreach ($technicians as $technician) {
            shuffle($categories);
            $numberOfServices = $faker->numberBetween(1, 4);
            $assignedCategories = array_slice($categories, 0, $numberOfServices);

            foreach ($assignedCategories as $category) {
                TechnicianService::create([
                    'technician_id' => $technician->id,
                    'category' => $category,
                    'active' => $faker->boolean(90),
                ]);
            }
        }

        $this->command->info('✅ Seeding layanan teknisi selesai.');
    }
}
