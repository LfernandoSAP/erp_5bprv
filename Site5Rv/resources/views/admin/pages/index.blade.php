@extends('layouts.admin')

@section('title', 'Páginas')

@section('content')
    @include('admin.partials.status-alert')

    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
            <div class="site-subtitle">Conteúdo institucional</div>
            <h1 class="font-heading display-5 mb-1">Páginas institucionais</h1>
            <p class="text-secondary mb-0">Gerencie páginas permanentes como histórico, área de atuação e conteúdo institucional.</p>
        </div>
        <a href="{{ route('admin.pages.create') }}" class="btn btn-bprv rounded-pill px-4 py-3">Nova página</a>
    </div>

    <div class="admin-card p-4">
        <div class="table-responsive">
            <table class="table align-middle">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Status</th>
                        <th>Publicação</th>
                        <th class="text-end">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($pages as $page)
                        <tr>
                            <td>
                                <div class="fw-semibold">{{ $page->title }}</div>
                                <div class="small text-secondary">{{ $page->slug }}</div>
                            </td>
                            <td><span class="badge text-bg-{{ $page->status === 'published' ? 'success' : 'secondary' }}">{{ $page->status === 'published' ? 'Publicado' : 'Rascunho' }}</span></td>
                            <td>{{ optional($page->published_at)->format('d/m/Y H:i') ?? 'Não publicada' }}</td>
                            <td class="text-end">
                                <div class="d-inline-flex gap-2">
                                    <a href="{{ route('admin.pages.edit', $page) }}" class="btn btn-sm btn-outline-bprv rounded-pill px-3">Editar</a>
                                    <form method="POST" action="{{ route('admin.pages.destroy', $page) }}" onsubmit="return confirm('Deseja remover esta página?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-sm btn-outline-danger rounded-pill px-3">Excluir</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="4" class="text-center py-5 text-secondary">Nenhuma página cadastrada ainda.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="pt-3">{{ $pages->links() }}</div>
    </div>
@endsection
