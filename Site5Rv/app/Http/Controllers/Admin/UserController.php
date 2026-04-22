<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\View\View;

class UserController extends Controller
{
    public function index(): View
    {
        return view('admin.users.index', [
            'users' => User::query()->latest()->paginate(12),
        ]);
    }

    public function create(): View
    {
        return view('admin.users.create', [
            'user' => new User([
                'role' => 'editor',
                'is_active' => true,
            ]),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create($this->validatedData($request->validated()));

        return redirect()->route('admin.users.index')->with('status', 'Usuário criado com sucesso.');
    }

    public function edit(User $user): View
    {
        return view('admin.users.edit', compact('user'));
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $this->validatedData($request->validated(), false);

        if ($request->user()->is($user)) {
            $data['role'] = 'admin';
            $data['is_active'] = true;
        }

        $user->update($data);

        return redirect()->route('admin.users.index')->with('status', 'Usuário atualizado com sucesso.');
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_if(auth()->id() === $user->id, 422, 'Você não pode remover sua própria conta por este módulo.');

        $user->delete();

        return redirect()->route('admin.users.index')->with('status', 'Usuário removido com sucesso.');
    }

    private function validatedData(array $validated, bool $requirePassword = true): array
    {
        $data = Arr::except($validated, ['password_confirmation']);
        $data['is_active'] = (bool) ($validated['is_active'] ?? false);

        if (! $requirePassword && blank($validated['password'] ?? null)) {
            unset($data['password']);
        }

        return $data;
    }
}
