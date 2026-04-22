<?php

namespace Tests\Feature;

use App\Models\Banner;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_post_and_banner_management_pages(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->actingAs($user)->get(route('admin.posts.index'))->assertOk();
        $this->actingAs($user)->get(route('admin.banners.index'))->assertOk();
    }

    public function test_published_posts_are_visible_on_public_pages(): void
    {
        $author = User::factory()->create([
            'role' => 'admin',
        ]);

        $post = Post::create([
            'title' => 'Publicação de teste',
            'slug' => 'publicacao-de-teste',
            'excerpt' => 'Resumo de teste',
            'content' => 'Conteúdo público de teste',
            'status' => 'published',
            'is_featured' => false,
            'published_at' => now(),
            'created_by' => $author->id,
            'updated_by' => $author->id,
        ]);

        $this->get(route('public.posts.index'))->assertOk()->assertSee($post->title);
        $this->get(route('public.posts.show', $post))->assertOk()->assertSee($post->title);
    }

    public function test_admin_can_create_post_and_banner_records(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->actingAs($user)->post(route('admin.posts.store'), [
            'title' => 'Nova notícia',
            'slug' => 'nova-noticia',
            'excerpt' => 'Resumo de teste',
            'content' => 'Conteúdo de teste',
            'status' => 'published',
            'published_at' => now()->format('Y-m-d H:i:s'),
            'is_featured' => '1',
        ])->assertRedirect(route('admin.posts.index'));

        $this->actingAs($user)->post(route('admin.banners.store'), [
            'title' => 'Banner de teste',
            'subtitle' => 'Subtítulo',
            'link_url' => 'https://example.com',
            'sort_order' => 1,
            'is_active' => '1',
        ])->assertRedirect(route('admin.banners.index'));

        $this->assertDatabaseHas('posts', ['slug' => 'nova-noticia']);
        $this->assertDatabaseHas('banners', ['title' => 'Banner de teste']);
    }
}
