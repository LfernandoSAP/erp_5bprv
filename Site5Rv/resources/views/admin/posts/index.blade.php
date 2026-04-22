@extends('layouts.admin')

@section('title', 'Notícias')

@section('content')
    @include('admin.partials.status-alert')

    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
            <div class="site-subtitle">Módulo editorial</div>
            <h1 class="font-heading display-5 mb-1">Notícias e publicações</h1>
            <p class="text-secondary mb-0">Gerencie o conteúdo jornalístico e institucional do portal.</p>
        </div>
        <a href="{{ route('admin.posts.create') }}" class="btn btn-bprv rounded-pill px-4 py-3">Nova notícia</a>
    </div>

    <div class="admin-card p-4">
        <div class="table-responsive">
            <table class="table align-middle">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Status</th>
                        <th>Publicação</th>
                        <th>Destaque</th>
                        <th class="text-end">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($posts as $post)
                        <tr>
                            <td>
                                <div class="fw-semibold">{{ $post->title }}</div>
                                <div class="small text-secondary">{{ $post->slug }}</div>
                            </td>
                            <td><span class="badge text-bg-{{ $post->status === 'published' ? 'success' : 'secondary' }}">{{ $post->status === 'published' ? 'Publicado' : 'Rascunho' }}</span></td>
                            <td>{{ optional($post->published_at)->format('d/m/Y H:i') ?? 'Não publicada' }}</td>
                            <td>{{ $post->is_featured ? 'Sim' : 'Não' }}</td>
                            <td class="text-end">
                                <div class="d-inline-flex gap-2">
                                    <a href="{{ route('admin.posts.edit', $post) }}" class="btn btn-sm btn-outline-bprv rounded-pill px-3">Editar</a>
                                    <form method="POST" action="{{ route('admin.posts.destroy', $post) }}" onsubmit="return confirm('Deseja remover esta notícia?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-sm btn-outline-danger rounded-pill px-3">Excluir</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center py-5 text-secondary">Nenhuma notícia cadastrada ainda.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="pt-3">
            {{ $posts->links() }}
        </div>
    </div>
@endsection
