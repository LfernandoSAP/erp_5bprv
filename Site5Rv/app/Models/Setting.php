<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class Setting extends Model
{
    protected $fillable = [
        'group',
        'key',
        'label',
        'type',
        'value',
        'created_by',
        'updated_by',
    ];

    public const PORTAL_DEFAULTS = [
        'portal_name' => '5º Batalhão de Polícia Rodoviária',
        'portal_subtitle' => 'Portal Institucional',
        'address' => 'Sorocaba - SP',
        'phone' => '(15) 3333-3140',
        'instagram_url' => 'https://www.instagram.com/',
        'footer_text' => 'Polícia Militar do Estado de São Paulo • 5º Batalhão de Polícia Rodoviária',
    ];

    public static function portalSettings(): array
    {
        if (! Schema::hasTable('settings')) {
            return self::PORTAL_DEFAULTS;
        }

        return array_merge(
            self::PORTAL_DEFAULTS,
            self::query()->pluck('value', 'key')->toArray(),
        );
    }

    public static function portalRecords(): Collection
    {
        return self::query()
            ->where('group', 'portal')
            ->orderBy('id')
            ->get();
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
