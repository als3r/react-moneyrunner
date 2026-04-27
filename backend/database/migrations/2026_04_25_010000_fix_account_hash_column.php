<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Account;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if column exists, if not add it
        if (!Schema::hasColumn('accounts', 'account_hash')) {
            Schema::table('accounts', function (Blueprint $table) {
                $table->string('account_hash', 64)->nullable()->after('id');
            });

            // Populate existing accounts with unique hashes
            Account::whereNull('account_hash')->get()->each(function ($account) {
                $account->account_hash = Str::random(32);
                $account->save();
            });

            // Make it not nullable
            Schema::table('accounts', function (Blueprint $table) {
                $table->string('account_hash', 64)->nullable(false)->change();
            });

            // Add unique constraint
            Schema::table('accounts', function (Blueprint $table) {
                $table->unique('account_hash');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropUnique('accounts_account_hash_unique');
            $table->dropColumn('account_hash');
        });
    }
};
