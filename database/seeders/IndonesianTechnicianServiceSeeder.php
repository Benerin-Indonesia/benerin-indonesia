<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\TechnicianService;
use Faker\Factory as Faker;

class IndonesianTechnicianServiceSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create('id_ID');

        $technicians = User::where('role', 'teknisi')->get();

        if ($technicians->isEmpty()) {
            $this->command->error('Tidak ada user dengan role "teknisi". Jalankan IndonesianUserSeeder dulu.');
            return;
        }

        $this->command->info('Menetapkan layanan untuk ' . $technicians->count() . ' teknisi...');

        $categories = ['ac', 'kulkas', 'tv', 'mesin-cuci'];

        foreach ($technicians as $technician) {
            // === Pastikan teknisi utama dapat layanan default AC ===
            if ($technician->email === 'teknisi@gmail.com') {
                TechnicianService::firstOrCreate(
                    [
                        'technician_id' => $technician->id,
                        'category' => 'ac',
                    ],
                    ['active' => true]
                );
                continue; // skip random, karena sudah fixed
            }

            // === Teknisi lain random ===
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
