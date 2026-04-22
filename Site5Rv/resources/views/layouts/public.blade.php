<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="{{ $settings['footer_text'] ?? 'Portal institucional do 5º Batalhão de Polícia Rodoviária.' }}">
    <title>@yield('title', $settings['portal_name'] ?? config('app.name'))</title>
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif
</head>
<body>
    <div class="site-topbar py-2">
        <div class="container d-flex flex-wrap justify-content-between gap-2">
            <span>{{ $settings['portal_subtitle'] ?? 'Portal Institucional' }}</span>
            <span>{{ $settings['address'] ?? '' }} @if(! empty($settings['phone'])) &bull; {{ $settings['phone'] }} @endif</span>
        </div>
    </div>

    <header class="site-header sticky-top">
        <div class="header-access-bar">
            <div class="container">
                <div class="d-flex justify-content-between align-items-center py-1">
                    <span class="text-muted small">{{ $settings['portal_subtitle'] ?? 'Portal Institucional' }}</span>
                    <div class="d-flex align-items-center gap-3">
                        <span class="text-muted small">{{ now()->format('d/m/Y') }}</span>
                        <a href="{{ route('login') }}" class="btn btn-sm btn-outline-dark rounded-pill px-3 fw-semibold">Acesso Administrativo</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="container py-3">
            <div class="d-flex align-items-center justify-content-between gap-2">
                <div class="header-logo-left">
                    <img src="{{ asset('imagens/LOGO MONOCROMATICO.png') }}"
                         alt="Polícia Militar do Estado de São Paulo"
                         class="header-logo-img">
                </div>
                <div class="header-center text-center">
                    <div class="site-subtitle mb-1">Polícia Militar do Estado de São Paulo</div>
                    <h1 class="site-title mb-1">5º BATALHÃO DE POLÍCIA RODOVIÁRIA</h1>
                    <p class="mb-0 site-tagline">Preservação da vida, segurança viária e presença institucional nas rodovias.</p>
                </div>
                <div class="header-logo-right">
                    <img src="{{ asset('imagens/logo_5rv.png') }}"
                         alt="5º Batalhão de Polícia Rodoviária"
                         class="header-logo-img">
                </div>
            </div>
        </div>

        <nav class="navbar navbar-expand-lg site-navbar p-0">
            <div class="container">
                <button class="navbar-toggler text-white border-0 py-3" type="button" data-bs-toggle="collapse" data-bs-target="#siteNav" aria-controls="siteNav" aria-expanded="false" aria-label="Alternar navegação">Menu</button>
                <div class="collapse navbar-collapse" id="siteNav">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item"><a class="nav-link" href="#inicio">Início</a></li>
                        <li class="nav-item"><a class="nav-link" href="#historico">Histórico</a></li>
                        <li class="nav-item"><a class="nav-link" href="#redes-sociais">Redes Sociais</a></li>
                        <li class="nav-item"><a class="nav-link" href="{{ route('public.posts.index') }}">Publicações</a></li>
                        <li class="nav-item"><a class="nav-link" href="{{ route('public.galleries.index') }}">Galerias</a></li>
                        <li class="nav-item"><a class="nav-link" href="#rodape">Contato</a></li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>

    <main>@yield('content')</main>

    <footer class="site-footer py-5" id="rodape">
        <div class="container">
            <div class="row g-4 align-items-start">
                <div class="col-lg-6">
                    <h2 class="font-heading fs-2 mb-3">{{ $settings['portal_name'] ?? '5º BPRv' }}</h2>
                    <p class="mb-0">{{ $settings['footer_text'] ?? '' }}</p>
                </div>
                <div class="col-sm-6 col-lg-3">
                    <strong class="d-block mb-2">Contato</strong>
                    <div>{{ $settings['address'] ?? '' }}</div>
                    <div>{{ $settings['phone'] ?? '' }}</div>
                </div>
                <div class="col-sm-6 col-lg-3">
                    <strong class="d-block mb-2">Redes</strong>
                    <a href="{{ $settings['instagram_url'] ?? '#' }}" target="_blank" rel="noopener noreferrer" class="text-white-50">Instagram institucional</a>
                </div>
            </div>
        </div>
    </footer>
</body>
</html>
