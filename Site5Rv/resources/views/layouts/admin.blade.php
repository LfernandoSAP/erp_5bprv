<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Admin') &bull; {{ config('app.name', 'Portal 5º BPRv') }}</title>
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif
</head>
<body class="admin-shell">
    <div class="admin-topbar text-white py-3 border-bottom border-warning-subtle">
        <div class="container-fluid px-4 d-flex justify-content-between align-items-center gap-3">
            <div>
                <div class="site-subtitle text-white-50">Painel administrativo</div>
                <div class="font-heading fs-3 mb-0">Portal 5º BPRv</div>
            </div>
            <div class="d-flex align-items-center gap-3">
                <span class="small text-white-50">{{ auth()->user()->name }}</span>
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="btn btn-sm btn-outline-light rounded-pill px-3">Sair</button>
                </form>
            </div>
        </div>
    </div>

    <div class="container-fluid px-0">
        <div class="row g-0">
            <aside class="col-lg-auto admin-sidebar p-4">
                <div class="mb-4">
                    <div class="font-heading fs-4 text-gold">Gestão do Portal</div>
                    <p class="mb-0 small text-white-50">Base preparada para conteúdo institucional, notícias, banners e galerias.</p>
                </div>
                <nav class="nav flex-column gap-2">
                    <a href="{{ route('admin.dashboard') }}" class="nav-link {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">Dashboard</a>
                    <a href="{{ route('admin.posts.index') }}" class="nav-link {{ request()->routeIs('admin.posts.*') ? 'active' : '' }}">Notícias</a>
                    <a href="{{ route('admin.banners.index') }}" class="nav-link {{ request()->routeIs('admin.banners.*') ? 'active' : '' }}">Banners</a>
                    <a href="{{ route('admin.pages.index') }}" class="nav-link {{ request()->routeIs('admin.pages.*') ? 'active' : '' }}">Páginas institucionais</a>
                    <a href="{{ route('admin.galleries.index') }}" class="nav-link {{ request()->routeIs('admin.galleries.*') ? 'active' : '' }}">Galerias</a>
                    @if (auth()->user()->isAdmin())
                        <a href="{{ route('admin.users.index') }}" class="nav-link {{ request()->routeIs('admin.users.*') ? 'active' : '' }}">Usuários</a>
                        <a href="{{ route('admin.settings.edit') }}" class="nav-link {{ request()->routeIs('admin.settings.*') ? 'active' : '' }}">Configurações</a>
                    @endif
                </nav>
            </aside>
            <section class="col p-4 p-lg-5">@yield('content')</section>
        </div>
    </div>
</body>
</html>
