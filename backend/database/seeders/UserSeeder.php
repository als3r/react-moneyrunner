<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'password' => bcrypt('password')]
        );

        User::firstOrCreate(
            ['email' => 'john@example.com'],
            ['name' => 'John Doe', 'password' => bcrypt('password')]
        );

        User::firstOrCreate(
            ['email' => 'jane@example.com'],
            ['name' => 'Jane Smith', 'password' => bcrypt('password')]
        );
    }
}
