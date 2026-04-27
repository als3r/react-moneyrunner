<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;
use Illuminate\Support\Str;

class AccountHashSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Account::whereNull('account_hash')->get()->each(function ($account) {
            $account->account_hash = Str::random(32);
            $account->save();
        });

        $this->command->info('Account hashes generated for existing accounts.');
    }
}
