@extends('layouts.admin')

@section('title', 'Dashboard')

@section('content')
    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
            <div class="site-subtitle">Fase 4</div>
            <h1 class="font-heading display-5 mb-1">Dashboard administrativo</h1>
            <p class="text-secondary mb-0">Painel consolidado para operação editorial, gestão institucional e preparação de publicação em ambiente Apache.</p>
        </div>
        <a href="{{ route('public.home') }}" class="btn btn-outline-bprv rounded-pill px-4">Ver portal público</a>
    </div>

    <div class="row g-4 mb-4">
        <div class="col-sm-6 col-xl-3"><div class="admin-card p-4 h-100"><div class="site-subtitle">Notícias</div><div class="stat-number">{{ $stats['posts'] }}</div><div class="text-secondary">publicações cadastradas</div></div></div>
        <div class="col-sm-6 col-xl-3"><div class="admin-card p-4 h-100"><div class="site-subtitle">Páginas</div><div class="stat-number">{{ $stats['pages'] }}</div><div class="text-secondary">páginas institucionais</div></div></div>
        <div class="col-sm-6 col-xl-3"><div class="admin-card p-4 h-100"><div class="site-subtitle">Banners</div><div class="stat-number">{{ $stats['banners'] }}</div><div class="text-secondary">destaques configurados</div></div></div>
        <div class="col-sm-6 col-xl-3"><div class="admin-card p-4 h-100"><div class="site-subtitle">Galerias</div><div class="stat-number">{{ $stats['galleries'] }}</div><div class="text-secondary">álbuns institucionais</div></div></div>
    </div>

    <div class="row g-4">
        <div class="col-xl-7">
            <div class="admin-card p-4 h-100">
                <div class="site-subtitle">Operação do portal</div>
                <h2 class="font-heading fs-1 mb-3">Acessos rápidos</h2>
                <div class="row g-3">
                    <div class="col-md-6"><a href="{{ route('admin.posts.index') }}" class="admin-quick-link"><h3 class="font-heading fs-3">Notícias</h3><p class="text-secondary mb-0">Gerencie publicações editoriais, destaques e status de publicação.</p></a></div>
                    <div class="col-md-6"><a href="{{ route('admin.banners.index') }}" class="admin-quick-link"><h3 class="font-heading fs-3">Banners</h3><p class="text-secondary mb-0">Organize o bloco principal da home com destaque institucional.</p></a></div>
                    <div class="col-md-6"><a href="{{ route('admin.pages.index') }}" class="admin-quick-link"><h3 class="font-heading fs-3">Páginas</h3><p class="text-secondary mb-0">Atualize histórico, conteúdos oficiais e seções permanentes do portal.</p></a></div>
                    <div class="col-md-6"><a href="{{ route('admin.galleries.index') }}" class="admin-quick-link"><h3 class="font-heading fs-3">Galerias</h3><p class="text-secondary mb-0">Mantenha o acervo visual com capas, fotos e organização editorial.</p></a></div>
                    @if (auth()->user()->isAdmin())
                        <div class="col-md-6"><a href="{{ route('admin.users.index') }}" class="admin-quick-link"><h3 class="font-heading fs-3">Usuários</h3><p class="text-secondary mb-0">Gerencie administradores, editores, status de acesso e manutenção de contas.</p></a></div>
                        <div class="col-md-6"><a href="{{ route('admin.settings.edit') }}" class="admin-quick-link"><h3 class="font-heading fs-3">Configurações</h3><p class="text-secondary mb-0">Atualize nome do portal, contato institucional, redes e conteúdo do rodapé.</p></a></div>
                    @endif
                </div>
            </div>
        </div>
        <div class="col-xl-5">
            <div class="admin-card p-4 h-100">
                <div class="site-subtitle">Conteúdo recente</div>
                <h2 class="font-heading fs-1 mb-3">Últimas publicações</h2>
                @if ($recentPosts->isEmpty())
                    <div class="border rounded-4 p-4 text-secondary">Ainda não há notícias publicadas. O painel já está pronto para iniciar a alimentação do portal.</div>
                @else
                    <div class="list-group list-group-flush">
                        @foreach ($recentPosts as $post)
                            <div class="list-group-item bg-transparent px-0 py-3">
                                <div class="font-heading fs-3 mb-1">{{ $post->title }}</div>
                                <div class="small text-secondary">{{ $post->status }} &bull; {{ optional($post->published_at)->format('d/m/Y H:i') ?? 'sem publicação' }}</div>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>
        </div>
    </div>
@endsection
