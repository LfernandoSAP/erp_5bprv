<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePortalSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class SettingController extends Controller
{
    public function edit(): View
    {
        return view('admin.settings.edit', [
            'settings' => Setting::portalSettings(),
        ]);
    }

    public function update(UpdatePortalSettingsRequest $request): RedirectResponse
    {
        $userId = $request->user()->id;
        $current = Setting::query()->where('group', 'portal')->get()->keyBy('key');
        $labels = $this->labels();
        $types = $this->types();

        foreach ($request->validated() as $key => $value) {
            Setting::query()->updateOrCreate(
                ['key' => $key],
                [
                    'group' => 'portal',
                    'label' => $labels[$key],
                    'type' => $types[$key],
                    'value' => $value,
                    'created_by' => $current[$key]?->created_by ?? $userId,
                    'updated_by' => $userId,
                ],
            );
        }

        return redirect()->route('admin.settings.edit')->with('status', 'Configurações atualizadas com sucesso.');
    }

    private function labels(): array
    {
        return [
            'portal_name' => 'Nome do portal',
            'portal_subtitle' => 'Subtítulo',
            'address' => 'Endereço',
            'phone' => 'Telefone',
            'instagram_url' => 'Instagram',
            'footer_text' => 'Rodapé institucional',
        ];
    }

    private function types(): array
    {
        return [
            'portal_name' => 'text',
            'portal_subtitle' => 'text',
            'address' => 'text',
            'phone' => 'text',
            'instagram_url' => 'url',
            'footer_text' => 'textarea',
        ];
    }
}
