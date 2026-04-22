@extends('layouts.admin')

@section('title', 'Configurações')

@section('content')
    @include('admin.partials.status-alert')

    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
            <div class="site-subtitle">Parâmetros institucionais</div>
            <h1 class="font-heading display-5 mb-1">Configurações do portal</h1>
            <p class="text-secondary mb-0">Mantenha a identidade institucional, os dados de contato e os links públicos do portal em um único lugar.</p>
        </div>
        <a href="{{ route('public.home') }}" class="btn btn-outline-bprv rounded-pill px-4 py-3">Ver portal público</a>
    </div>

    <form method="POST" action="{{ route('admin.settings.update') }}">
        @csrf
        @method('PUT')

        <div class="row g-4">
            <div class="col-xl-8">
                <div class="admin-card p-4 h-100">
                    <div class="section-label text-dark mb-3">Identidade</div>
                    <div class="mb-3">
                        <label for="portal_name" class="form-label fw-semibold">Nome do portal</label>
                        <input type="text" class="form-control rounded-4 @error('portal_name') is-invalid @enderror" id="portal_name" name="portal_name" value="{{ old('portal_name', $settings['portal_name']) }}" required>
                        @error('portal_name')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    </div>
                    <div class="mb-4">
                        <label for="portal_subtitle" class="form-label fw-semibold">Subtítulo</label>
                        <input type="text" class="form-control rounded-4 @error('portal_subtitle') is-invalid @enderror" id="portal_subtitle" name="portal_subtitle" value="{{ old('portal_subtitle', $settings['portal_subtitle']) }}">
                        @error('portal_subtitle')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    </div>

                    <div class="section-label text-dark mb-3">Contato</div>
                    <div class="row g-3 mb-4">
                        <div class="col-md-8">
                            <label for="address" class="form-label fw-semibold">Endereço</label>
                            <input type="text" class="form-control rounded-4 @error('address') is-invalid @enderror" id="address" name="address" value="{{ old('address', $settings['address']) }}">
                            @error('address')<div class="invalid-feedback">{{ $message }}</div>@enderror
                        </div>
                        <div class="col-md-4">
                            <label for="phone" class="form-label fw-semibold">Telefone</label>
                            <input type="text" class="form-control rounded-4 @error('phone') is-invalid @enderror" id="phone" name="phone" value="{{ old('phone', $settings['phone']) }}">
                            @error('phone')<div class="invalid-feedback">{{ $message }}</div>@enderror
                        </div>
                    </div>

                    <div class="section-label text-dark mb-3">Presença digital</div>
                    <div>
                        <label for="instagram_url" class="form-label fw-semibold">Instagram institucional</label>
                        <input type="url" class="form-control rounded-4 @error('instagram_url') is-invalid @enderror" id="instagram_url" name="instagram_url" value="{{ old('instagram_url', $settings['instagram_url']) }}" placeholder="https://www.instagram.com/...">
                        @error('instagram_url')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    </div>
                </div>
            </div>

            <div class="col-xl-4">
                <div class="admin-card p-4 mb-4">
                    <div class="section-label text-dark mb-3">Rodapé</div>
                    <div class="mb-4">
                        <label for="footer_text" class="form-label fw-semibold">Texto institucional</label>
                        <textarea class="form-control rounded-4 @error('footer_text') is-invalid @enderror" id="footer_text" name="footer_text" rows="8">{{ old('footer_text', $settings['footer_text']) }}</textarea>
                        @error('footer_text')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    </div>
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-bprv rounded-pill py-3">Salvar configurações</button>
                        <a href="{{ route('admin.dashboard') }}" class="btn btn-outline-bprv rounded-pill py-3">Voltar ao dashboard</a>
                    </div>
                </div>

                <div class="admin-card p-4">
                    <div class="site-subtitle">Impacto no portal</div>
                    <h2 class="font-heading fs-2 mb-3">Onde isso aparece</h2>
                    <p class="text-secondary mb-2">Esses dados alimentam automaticamente:</p>
                    <ul class="mb-0 text-secondary">
                        <li>topo e rodapé do portal público</li>
                        <li>metadados institucionais da home</li>
                        <li>contato e link social nas páginas públicas</li>
                    </ul>
                </div>
            </div>
        </div>
    </form>
@endsection
