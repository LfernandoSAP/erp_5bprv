@extends('layouts.admin')

@section('title', 'Banners')

@section('content')
    @include('admin.partials.status-alert')

    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
            <div class="site-subtitle">Destaques da home</div>
            <h1 class="font-heading display-5 mb-1">Banners</h1>
            <p class="text-secondary mb-0">Gerencie os destaques principais exibidos na abertura do portal.</p>
        </div>
        <a href="{{ route('admin.banners.create') }}" class="btn btn-bprv rounded-pill px-4 py-3">Novo banner</a>
    </div>

    <div class="admin-card p-4">
        <div class="table-responsive">
            <table class="table align-middle">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Ordem</th>
                        <th>Status</th>
                        <th>Link</th>
                        <th class="text-end">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($banners as $banner)
                        <tr>
                            <td>
                                <div class="fw-semibold">{{ $banner->title }}</div>
                                <div class="small text-secondary">{{ $banner->subtitle }}</div>
                            </td>
                            <td>{{ $banner->sort_order }}</td>
                            <td><span class="badge text-bg-{{ $banner->is_active ? 'success' : 'secondary' }}">{{ $banner->is_active ? 'Ativo' : 'Inativo' }}</span></td>
                            <td>{{ $banner->link_url ?: 'Sem link' }}</td>
                            <td class="text-end">
                                <div class="d-inline-flex gap-2">
                                    <a href="{{ route('admin.banners.edit', $banner) }}" class="btn btn-sm btn-outline-bprv rounded-pill px-3">Editar</a>
                                    <form method="POST" action="{{ route('admin.banners.destroy', $banner) }}" onsubmit="return confirm('Deseja remover este banner?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-sm btn-outline-danger rounded-pill px-3">Excluir</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center py-5 text-secondary">Nenhum banner cadastrado ainda.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="pt-3">
            {{ $banners->links() }}
        </div>
    </div>
@endsection
