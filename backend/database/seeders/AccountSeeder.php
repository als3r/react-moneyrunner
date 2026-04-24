<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Currency;
use App\Models\User;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $usd = Currency::where('code', 'USD')->first();
        $eur = Currency::where('code', 'EUR')->first();

        foreach ($users as $user) {
            Account::create([
                'user_id' => $user->id,
                'currency_id' => $usd->id,
                'name' => 'Main Checking',
                'balance' => 5000.00,
                'type' => 'checking',
            ]);

            Account::create([
                'user_id' => $user->id,
                'currency_id' => $usd->id,
                'name' => 'Savings',
                'balance' => 15000.00,
                'type' => 'savings',
            ]);

            Account::create([
                'user_id' => $user->id,
                'currency_id' => $eur->id,
                'name' => 'Euro Account',
                'balance' => 2000.00,
                'type' => 'checking',
            ]);
        }
    }
}
