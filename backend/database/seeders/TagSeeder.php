<?php

namespace Database\Seeders;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $users = \App\Models\User::all();

        foreach ($users as $user) {
            $tags = [
                ['name' => 'weekly', 'color' => '#3B82F6'],
                ['name' => 'monthly', 'color' => '#10B981'],
                ['name' => 'essential', 'color' => '#EF4444'],
                ['name' => 'dining', 'color' => '#F59E0B'],
                ['name' => 'daily', 'color' => '#8B5CF6'],
                ['name' => 'seasonal', 'color' => '#EAB308'],
                ['name' => 'one-time', 'color' => '#6B7280'],
                ['name' => 'recurring', 'color' => '#14B8A6'],
            ];

            foreach ($tags as $tag) {
                \App\Models\Tag::firstOrCreate(
                    ['user_id' => $user->id, 'name' => $tag['name']],
                    $tag
                );
            }
        }
    }
}
