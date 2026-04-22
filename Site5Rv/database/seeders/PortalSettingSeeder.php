<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class PortalSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['group' => 'portal', 'key' => 'portal_name', 'label' => 'Nome do portal', 'type' => 'text', 'value' => Setting::PORTAL_DEFAULTS['portal_name']],
            ['group' => 'portal', 'key' => 'portal_subtitle', 'label' => 'Subtítulo', 'type' => 'text', 'value' => Setting::PORTAL_DEFAULTS['portal_subtitle']],
            ['group' => 'portal', 'key' => 'address', 'label' => 'Endereço', 'type' => 'text', 'value' => Setting::PORTAL_DEFAULTS['address']],
            ['group' => 'portal', 'key' => 'phone', 'label' => 'Telefone', 'type' => 'text', 'value' => Setting::PORTAL_DEFAULTS['phone']],
            ['group' => 'portal', 'key' => 'instagram_url', 'label' => 'Instagram', 'type' => 'url', 'value' => Setting::PORTAL_DEFAULTS['instagram_url']],
            ['group' => 'portal', 'key' => 'footer_text', 'label' => 'Rodapé institucional', 'type' => 'textarea', 'value' => Setting::PORTAL_DEFAULTS['footer_text']],
        ];

        foreach ($settings as $setting) {
            Setting::query()->updateOrCreate(
                ['key' => $setting['key']],
                $setting,
            );
        }
    }
}
