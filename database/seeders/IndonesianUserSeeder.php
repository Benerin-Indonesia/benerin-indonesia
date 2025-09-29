<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Faker\Factory as Faker;

class IndonesianUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Membersihkan tabel user untuk menghindari data duplikat saat seeding ulang
        Schema::disableForeignKeyConstraints();
        // User::truncate();
        Schema::enableForeignKeyConstraints();

        $faker = Faker::create('id_ID');

        // === 1. BUAT SUPER ADMIN ===
        // $this->command->info('Membuat user Admin...');
        // User::create([
        //     'name' => 'Admin Utama',
        //     'email' => 'admin@app.com',
        //     'password' => Hash::make('password'), // password: password
        //     'role' => 'admin',
        //     'phone' => '081200000001',
        //     'photo' => null,
        //     'email_verified_at' => now(),
        // ]);

        // === 2. BUAT 10 TEKNISI ===
        $this->command->info('Membuat 10 user Teknisi...');
        for ($i = 0; $i < 10; $i++) {
            User::create([
                'name' => 'Teknisi ' . $faker->firstName,
                'email' => $faker->unique()->safeEmail,
                'password' => Hash::make('password'),
                'role' => 'teknisi',
                'phone' => '085156010707',
                'photo' => null,
                'email_verified_at' => now(),
            ]);
        }

        // === 3. BUAT 25 PELANGGAN ===
        $this->command->info('Membuat 25 user Pelanggan...');
        for ($i = 0; $i < 25; $i++) {
            User::create([
                'name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'password' => Hash::make('password'),
                'role' => 'pelanggan',
                'phone' => $faker->phoneNumber,
                'photo' => null,
                'email_verified_at' => now(),
            ]);
        }

        $this->command->info('✅ Seeding user selesai.');
    }
}