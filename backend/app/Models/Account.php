<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Account extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'type',
        'currency_id',
        'balance',
        'initial_balance',
        'description',
        'is_active',
        'account_hash',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'initial_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($account) {
            if (empty($account->account_hash)) {
                $slug = Str::slug($account->name);
                $randomSuffix = Str::random(8);
                $account->account_hash = $slug . '-' . $randomSuffix;
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
