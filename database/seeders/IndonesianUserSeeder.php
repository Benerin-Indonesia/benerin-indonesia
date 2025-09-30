<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class IndonesianUserSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create('id_ID');

        // === 1. BUAT TEKNISI PEGANGAN ===
        $this->command->info('Membuat akun teknisi pegangan...');
        User::firstOrCreate(
            ['email' => 'teknisi@gmail.com'],
            [
                'name' => 'Teknisi AC',
                'password' => Hash::make('11111111'),
                'role' => 'teknisi',
                'phone' => '081200000001',
                'photo' => null,
                'email_verified_at' => now(),
            ]
        );

        // === 2. BUAT USER PEGANGAN ===
        $this->command->info('Membuat akun user pegangan...');
        User::firstOrCreate(
            ['email' => 'user@gmail.com'],
            [
                'name' => 'User Pegangan',
                'password' => Hash::make('11111111'),
                'role' => 'user',
                'phone' => '081200000002',
                'photo' => null,
                'email_verified_at' => now(),
            ]
        );

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

        // === 4. BUAT 25 USER DUMMY ===
        $this->command->info('Membuat 25 user ...');
        for ($i = 0; $i < 25; $i++) {
            User::create([
                'name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => $faker->phoneNumber,
                'photo' => null,
                'email_verified_at' => now(),
            ]);
        }

        $this->command->info('✅ Seeding user selesai.');
    }
}