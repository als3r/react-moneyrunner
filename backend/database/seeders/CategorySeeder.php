<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $users = \App\Models\User::all();

        foreach ($users as $user) {
            $categories = [
                ['name' => 'Food', 'description' => 'Groceries, dining, food delivery'],
                ['name' => 'Transport', 'description' => 'Gas, public transport, car maintenance'],
                ['name' => 'Utilities', 'description' => 'Electricity, water, internet, phone'],
                ['name' => 'Entertainment', 'description' => 'Movies, games, subscriptions'],
                ['name' => 'Health', 'description' => 'Medical, pharmacy, gym'],
                ['name' => 'Shopping', 'description' => 'Clothing, electronics, household items'],
                ['name' => 'Education', 'description' => 'Books, courses, tuition'],
                ['name' => 'Housing', 'description' => 'Rent, mortgage, home repairs'],
            ];

            foreach ($categories as $category) {
                \App\Models\Category::firstOrCreate(
                    ['user_id' => $user->id, 'name' => $category['name']],
                    $category
                );
            }
        }
    }
}
