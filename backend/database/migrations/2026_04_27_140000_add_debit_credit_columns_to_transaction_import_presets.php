<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transaction_import_presets', function (Blueprint $table) {
            // No schema changes needed - column_mapping is JSON and can handle the structure
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaction_import_presets', function (Blueprint $table) {
            // No schema changes needed
        });
    }
};
