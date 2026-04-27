<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;
use Illuminate\Support\Str;

class PopulateAccountHashes extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = Account::whereNull('account_hash')->get();
        
        foreach ($accounts as $account) {
            $account->account_hash = Str::random(32);
            $account->save();
        }

        $this->command->info("Populated account_hash for {$accounts->count()} accounts.");
    }
}
