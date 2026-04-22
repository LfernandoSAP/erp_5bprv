<?php

namespace Tests\Feature;

use App\Models\Gallery;
use App\Models\Page;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstitutionalContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_pages_and_galleries(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->actingAs($user)->get(route('admin.pages.index'))->assertOk();
        $this->actingAs($user)->get(route('admin.galleries.index'))->assertOk();
    }

    public function test_published_page_is_visible_publicly(): void
    {
        $author = User::factory()->create(['role' => 'admin']);

        $page = Page::create([
            'title' => 'Histórico',
            'slug' => 'historico',
            'excerpt' => 'Resumo institucional',
            'content' => 'Conteúdo institucional',
            'status' => 'published',
            'published_at' => now(),
            'created_by' => $author->id,
            'updated_by' => $author->id,
        ]);

        $this->get(route('public.pages.show', $page))->assertOk()->assertSee($page->title);
    }

    public function test_published_gallery_is_visible_publicly(): void
    {
        $author = User::factory()->create(['role' => 'admin']);

        $gallery = Gallery::create([
            'title' => 'Galeria Teste',
            'slug' => 'galeria-teste',
            'description' => 'Descrição',
            'status' => 'published',
            'published_at' => now(),
            'created_by' => $author->id,
            'updated_by' => $author->id,
        ]);

        $gallery->photos()->create([
            'title' => 'Foto 1',
            'file_path' => 'galleries/photos/teste.jpg',
            'caption' => 'Legenda',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->get(route('public.galleries.index'))->assertOk()->assertSee($gallery->title);
        $this->get(route('public.galleries.show', $gallery))->assertOk()->assertSee($gallery->title);
    }

    public function test_admin_can_update_portal_settings_and_home_uses_new_values(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        Setting::query()->create([
            'group' => 'portal',
            'key' => 'portal_name',
            'label' => 'Nome do portal',
            'type' => 'text',
            'value' => 'Portal Antigo',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->get(route('admin.settings.edit'))
            ->assertOk()
            ->assertSee('Configurações do portal');

        $this->actingAs($user)
            ->put(route('admin.settings.update'), [
                'portal_name' => 'Portal Institucional 5º BPRv',
                'portal_subtitle' => 'Comunicação Oficial',
                'address' => 'Rodovia Exemplo, km 123',
                'phone' => '(11) 4000-5000',
                'instagram_url' => 'https://www.instagram.com/5bprv/',
                'footer_text' => 'Texto institucional atualizado',
            ])
            ->assertRedirect(route('admin.settings.edit'));

        $this->assertDatabaseHas('settings', [
            'key' => 'portal_name',
            'value' => 'Portal Institucional 5º BPRv',
        ]);

        $this->get(route('public.home'))
            ->assertOk()
            ->assertSee('Portal Institucional 5º BPRv')
            ->assertSee('Rodovia Exemplo, km 123')
            ->assertSee('Texto institucional atualizado');
    }
}
