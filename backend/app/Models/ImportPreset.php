<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportPreset extends Model
{
    protected $table = 'transaction_import_presets';

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'column_mapping',
        'date_format',
        'amount_format',
        'skip_header_row',
    ];

    protected $casts = [
        'column_mapping' => 'array',
        'skip_header_row' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
