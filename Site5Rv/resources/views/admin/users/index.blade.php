@extends('layouts.admin')

@section('title', 'Usuários')

@section('content')
    @include('admin.partials.status-alert')

    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
            <div class="site-subtitle">Controle de acesso</div>
            <h1 class="font-heading display-5 mb-1">Usuários do portal</h1>
            <p class="text-secondary mb-0">Gerencie administradores e editores com controle simples de perfil e status de acesso.</p>
        </div>
        <a href="{{ route('admin.users.create') }}" class="btn btn-bprv rounded-pill px-4 py-3">Novo usuário</a>
    </div>

    <div class="admin-card p-4">
        <div class="table-responsive">
            <table class="table align-middle">
                <thead>
                    <tr>
                        <th>Usuário</th>
                        <th>Perfil</th>
                        <th>Status</th>
                        <th>Último acesso</th>
                        <th class="text-end">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($users as $user)
                        <tr>
                            <td>
                                <div class="fw-semibold">{{ $user->name }}</div>
                                <div class="small text-secondary">{{ $user->email }}</div>
                            </td>
                            <td>
                                <span class="badge text-bg-{{ $user->role === 'admin' ? 'dark' : 'secondary' }}">
                                    {{ $user->role === 'admin' ? 'Administrador' : 'Editor' }}
                                </span>
                            </td>
                            <td>
                                <span class="badge text-bg-{{ $user->is_active ? 'success' : 'secondary' }}">
                                    {{ $user->is_active ? 'Ativo' : 'Inativo' }}
                                </span>
                            </td>
                            <td>{{ optional($user->last_login_at)->format('d/m/Y H:i') ?? 'Sem registro' }}</td>
                            <td class="text-end">
                                <div class="d-inline-flex gap-2">
                                    <a href="{{ route('admin.users.edit', $user) }}" class="btn btn-sm btn-outline-bprv rounded-pill px-3">Editar</a>
                                    @if (! auth()->user()->is($user))
                                        <form method="POST" action="{{ route('admin.users.destroy', $user) }}" onsubmit="return confirm('Deseja remover este usuário?');">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="btn btn-sm btn-outline-danger rounded-pill px-3">Excluir</button>
                                        </form>
                                    @endif
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="text-center py-5 text-secondary">Nenhum usuário cadastrado.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="pt-3">{{ $users->links() }}</div>
    </div>
@endsection
