<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Update all accounts to use name-based slug with random suffix
$accounts = \App\Models\Account::all();

echo "Updating " . $accounts->count() . " accounts to use name-based hashes\n";

foreach ($accounts as $account) {
    $slug = \Illuminate\Support\Str::slug($account->name);
    $randomSuffix = \Illuminate\Support\Str::random(8);
    $newHash = $slug . '-' . $randomSuffix;
    
    $account->account_hash = $newHash;
    $account->save();
    echo "Updated account ID {$account->id} ({$account->name}) with hash: {$newHash}\n";
}

echo "\nDone!\n";
