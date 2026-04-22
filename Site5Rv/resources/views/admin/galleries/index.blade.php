@extends('layouts.admin')

@section('title', 'Galerias')

@section('content')
    @include('admin.partials.status-alert')

    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
            <div class="site-subtitle">Galerias institucionais</div>
            <h1 class="font-heading display-5 mb-1">Galerias</h1>
            <p class="text-secondary mb-0">Organize álbuns de fotos e seus destaques institucionais.</p>
        </div>
        <a href="{{ route('admin.galleries.create') }}" class="btn btn-bprv rounded-pill px-4 py-3">Nova galeria</a>
    </div>

    <div class="admin-card p-4">
        <div class="table-responsive">
            <table class="table align-middle">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Status</th>
                        <th>Fotos</th>
                        <th>Publicação</th>
                        <th class="text-end">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($galleries as $gallery)
                        <tr>
                            <td>
                                <div class="fw-semibold">{{ $gallery->title }}</div>
                                <div class="small text-secondary">{{ $gallery->slug }}</div>
                            </td>
                            <td><span class="badge text-bg-{{ $gallery->status === 'published' ? 'success' : 'secondary' }}">{{ $gallery->status === 'published' ? 'Publicada' : 'Rascunho' }}</span></td>
                            <td>{{ $gallery->photos_count }}</td>
                            <td>{{ optional($gallery->published_at)->format('d/m/Y H:i') ?? 'Não publicada' }}</td>
                            <td class="text-end">
                                <div class="d-inline-flex gap-2">
                                    <a href="{{ route('admin.galleries.edit', $gallery) }}" class="btn btn-sm btn-outline-bprv rounded-pill px-3">Editar</a>
                                    <form method="POST" action="{{ route('admin.galleries.destroy', $gallery) }}" onsubmit="return confirm('Deseja remover esta galeria?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-sm btn-outline-danger rounded-pill px-3">Excluir</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="text-center py-5 text-secondary">Nenhuma galeria cadastrada ainda.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="pt-3">{{ $galleries->links() }}</div>
    </div>
@endsection
