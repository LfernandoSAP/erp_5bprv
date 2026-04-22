<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_users(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Editor Operacional',
                'email' => 'editor@example.com',
                'role' => 'editor',
                'is_active' => '1',
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
            ])
            ->assertRedirect(route('admin.users.index'));

        $user = User::query()->where('email', 'editor@example.com')->firstOrFail();

        $this->actingAs($admin)
            ->put(route('admin.users.update', $user), [
                'name' => 'Editor Atualizado',
                'email' => 'editor@example.com',
                'role' => 'editor',
                'password' => '',
                'password_confirmation' => '',
            ])
            ->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseHas('users', [
            'email' => 'editor@example.com',
            'name' => 'Editor Atualizado',
            'role' => 'editor',
        ]);
    }

    public function test_editor_cannot_access_admin_only_modules(): void
    {
        $editor = User::factory()->create([
            'role' => 'editor',
        ]);

        $this->actingAs($editor)->get(route('admin.posts.index'))->assertOk();
        $this->actingAs($editor)->get(route('admin.users.index'))->assertForbidden();
        $this->actingAs($editor)->get(route('admin.settings.edit'))->assertForbidden();
    }

    public function test_admin_cannot_delete_own_account_from_user_module(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $admin))
            ->assertStatus(422);

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
        ]);
    }
}
