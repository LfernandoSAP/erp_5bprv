<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Portal 5º BPRv') }}</title>
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif
</head>
<body class="login-page d-flex align-items-center py-5">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <div class="row g-0 login-card overflow-hidden">
                    <div class="col-lg-5 p-4 p-lg-5 text-white" style="background: linear-gradient(160deg, #111111, #2b2b2b);">
                        <div class="site-subtitle text-white-50">Acesso restrito</div>
                        <h1 class="font-heading display-5 mb-3">Portal administrativo do 5º BPRv</h1>
                        <p class="mb-4 text-white-50">Autenticação simples para gestão de conteúdo institucional, publicações, banners e galerias.</p>
                        <a href="{{ route('public.home') }}" class="btn btn-outline-light rounded-pill px-4">Voltar ao portal</a>
                    </div>
                    <div class="col-lg-7 p-4 p-lg-5 bg-white">
                        {{ $slot }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
