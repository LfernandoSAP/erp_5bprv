@extends('layouts.public')

@section('title', 'Portal Institucional do 5º BPRv')

@section('content')
    <section class="section-shell pt-5" id="inicio">
        <div class="container">
            <div class="hero-grid">
                @foreach ($heroBanners as $index => $banner)
                    @php
                        $heroStyle = ! empty($banner['image_path'])
                            ? "background-image: linear-gradient(180deg, rgba(16, 16, 16, 0.18), rgba(16, 16, 16, 0.82)), url('".e(\Illuminate\Support\Facades\Storage::url($banner['image_path']))."');"
                            : '';
                    @endphp
                    <article class="hero-card text-white p-4 p-lg-5 animate-fade-in delay-100 {{ $index === 0 ? 'is-primary d-flex flex-column justify-content-end' : 'd-flex flex-column justify-content-between' }} {{ ! empty($banner['image_path']) ? 'has-media' : '' }}" @if ($heroStyle) style="{{ $heroStyle }}" @endif>
                        <div class="hero-label">{{ $index === 0 ? 'Destaque institucional' : 'Atuação' }}</div>
                        <div>
                            <h2 class="display-4 mb-3">{{ $banner['title'] }}</h2>
                            <p class="lead mb-4 text-white-50">{{ $banner['subtitle'] }}</p>
                            <a href="{{ $banner['link_url'] ?? '#' }}" class="btn btn-light rounded-pill px-4 fw-semibold">Saiba mais</a>
                        </div>
                    </article>
                @endforeach
            </div>

            <div class="row g-4 mt-1">
                <div class="col-lg-8">
                    <div class="section-card p-4 p-lg-5 animate-fade-in delay-200">
                        <div class="section-label text-dark mb-3">Mensagem institucional</div>
                        <div class="row g-4 align-items-center">
                            <div class="col-md-8">
                                <h2 class="font-heading display-6 mb-3">Portal oficial para comunicação, memória institucional e transparência pública</h2>
                                <p class="mb-0 text-secondary fs-5">Esta plataforma foi estruturada para consolidar conteúdo oficial do 5º Batalhão de Polícia Rodoviária com linguagem sóbria, organização editorial e base preparada para evolução contínua.</p>
                            </div>
                            <div class="col-md-4">
                                <div class="contact-pillar">
                                    <div class="site-subtitle mb-2">Contato institucional</div>
                                    <div class="font-heading fs-2 mb-2">{{ $settings['phone'] ?? '(15) 3333-3140' }}</div>
                                    <p class="small text-secondary mb-0">{{ $settings['address'] ?? 'Sorocaba - SP' }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="section-card p-4 p-lg-5 h-100 animate-fade-in delay-300">
                        <div class="section-label text-dark mb-3">Acesso rápido</div>
                        <div class="quick-links-list">
                            <a href="#historico" class="quick-link-card">
                                <span class="quick-link-card__eyebrow">Institucional</span>
                                <strong>Histórico da unidade</strong>
                            </a>
                            <a href="{{ route('public.posts.index') }}" class="quick-link-card">
                                <span class="quick-link-card__eyebrow">Editorial</span>
                                <strong>Publicações oficiais</strong>
                            </a>
                            <a href="{{ route('public.galleries.index') }}" class="quick-link-card">
                                <span class="quick-link-card__eyebrow">Acervo</span>
                                <strong>Galerias e registros</strong>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="section-shell" id="historico">
        <div class="container">
            <div class="row align-items-center g-4">
                <div class="col-lg-5">
                    <div class="section-stripe mb-3"></div>
                    <div class="section-label text-dark mb-3">Histórico institucional</div>
                    <h2 class="section-title mb-3">Presença operacional com identidade institucional forte</h2>
                    <p class="lead text-secondary mb-0">{{ $historyPage['excerpt'] ?? 'Conteúdo institucional em construção.' }}</p>
                </div>
                <div class="col-lg-7">
                    <div class="section-card p-4 p-lg-5 animate-fade-in delay-200">
                        <div class="row g-4">
                            <div class="col-md-6">
                                <div class="info-panel">
                                    <h3 class="font-heading fs-2 mb-2">{{ $historyPage['title'] ?? 'Missão' }}</h3>
                                    <p class="mb-0 text-secondary">Atuar com disciplina, prevenção e visibilidade institucional para fortalecer a segurança viária e a confiança pública.</p>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-panel">
                                    <h3 class="font-heading fs-2 mb-2">Diretriz</h3>
                                    <p class="mb-0 text-secondary">Comunicação clara, conteúdo oficial e estrutura preparada para crescimento gradual do portal.</p>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="rounded-4 p-4" style="background: linear-gradient(135deg, rgba(16,16,16,0.96), rgba(45,45,45,0.92));">
                                    <div class="row g-3 text-white">
                                        <div class="col-sm-4">
                                            <div class="site-subtitle text-white-50">Foco</div>
                                            <div class="font-heading fs-2">Segurança viária</div>
                                        </div>
                                        <div class="col-sm-4">
                                            <div class="site-subtitle text-white-50">Perfil</div>
                                            <div class="font-heading fs-2">Sobriedade institucional</div>
                                        </div>
                                        <div class="col-sm-4">
                                            <div class="site-subtitle text-white-50">Estratégia</div>
                                            <div class="font-heading fs-2 text-gold">Portal escalável</div>
                                        </div>
                                    </div>
                                    @if (! empty($historyPage['slug']))
                                        <div class="mt-4">
                                            <a href="{{ route('public.pages.show', $historyPage['slug']) }}" class="btn btn-outline-light rounded-pill px-4">Ler página institucional</a>
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="section-shell pt-0" id="redes-sociais">
        <div class="container">
            <div class="row g-4">
                <div class="col-lg-4">
                    <div class="section-card h-100 p-4 p-lg-5 animate-fade-in delay-100">
                        <div class="section-label text-dark mb-3">Redes sociais</div>
                        <h2 class="font-heading fs-1 mb-3">Canal direto com a comunidade</h2>
                        <p class="text-secondary">Espaço reservado para integração com Instagram e outras redes oficiais do batalhão.</p>
                        <a href="{{ $settings['instagram_url'] ?? '#' }}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-bprv rounded-pill px-4">Ver Instagram</a>
                    </div>
                </div>
                <div class="col-lg-8">
                    <div class="section-card h-100 p-4 p-lg-5 animate-fade-in delay-200">
                        <div class="row g-4">
                            <div class="col-md-6">
                                <div class="publication-cover rounded-4 d-flex align-items-end p-4 text-white">
                                    <div>
                                        <div class="site-subtitle text-white-50">Comunicação institucional</div>
                                        <div class="font-heading fs-1">Operação, informação e transparência</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 d-flex align-items-center">
                                <p class="mb-0 text-secondary fs-5">Esta área está pronta para receber integração dinâmica com os canais oficiais da unidade, reforçando presença digital, divulgação de campanhas e proximidade com o cidadão.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="section-shell pt-0">
        <div class="container">
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="section-card p-4 h-100">
                        <div class="section-label text-dark mb-3">Atuação</div>
                        <h2 class="font-heading fs-2 mb-3">Presença especializada</h2>
                        <p class="text-secondary mb-0">Atuação voltada à fiscalização, prevenção e policiamento ostensivo rodoviário com foco na preservação da vida.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="section-card p-4 h-100">
                        <div class="section-label text-dark mb-3">Comunicação</div>
                        <h2 class="font-heading fs-2 mb-3">Conteúdo oficial</h2>
                        <p class="text-secondary mb-0">Publicações, páginas e galerias organizadas para fortalecer a comunicação institucional com clareza e consistência.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="section-card p-4 h-100">
                        <div class="section-label text-dark mb-3">Serviço</div>
                        <h2 class="font-heading fs-2 mb-3">Referência pública</h2>
                        <p class="text-secondary mb-0">Ambiente pensado para apoiar consulta, memória institucional e aproximação com a comunidade atendida pela unidade.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="section-shell" id="publicacoes">
        <div class="container">
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
                <div>
                    <div class="section-stripe mb-3"></div>
                    <div class="section-label text-dark mb-3">Últimas publicações</div>
                    <h2 class="section-title mb-0">Conteúdo editorial preparado para crescer</h2>
                </div>
                <a href="{{ route('public.posts.index') }}" class="btn btn-outline-bprv rounded-pill px-4">Ver todas</a>
            </div>

            <div class="row g-4">
                @foreach ($latestPosts as $post)
                    <div class="col-lg-4">
                        <article class="publication-card animate-fade-in delay-100">
                            @php
                                $postStyle = ! empty($post['image_path'])
                                    ? "background-image: linear-gradient(180deg, rgba(16, 16, 16, 0.14), rgba(16, 16, 16, 0.76)), url('".e(\Illuminate\Support\Facades\Storage::url($post['image_path']))."');"
                                    : '';
                            @endphp
                            <div class="publication-cover p-4 d-flex align-items-end text-white {{ ! empty($post['image_path']) ? 'has-media' : '' }}" @if ($postStyle) style="{{ $postStyle }}" @endif>
                                <div>
                                    <div class="site-subtitle text-white-50">Publicação institucional</div>
                                    <h3 class="font-heading fs-1 mb-0">{{ $post['title'] }}</h3>
                                </div>
                            </div>
                            <div class="p-4">
                                <div class="small text-secondary mb-2">{{ \Illuminate\Support\Carbon::parse($post['published_at'])->format('d/m/Y') }}</div>
                                <p class="text-secondary">{{ $post['excerpt'] }}</p>
                                <a href="{{ route('public.posts.show', $post['slug']) }}" class="btn btn-outline-bprv rounded-pill px-4">Ler notícia</a>
                            </div>
                        </article>
                    </div>
                @endforeach
            </div>
        </div>
    </section>

    <section class="section-shell" id="galeria">
        <div class="container">
            <div class="row g-4 align-items-center">
                <div class="col-lg-4">
                    <div class="section-card p-4 p-lg-5 h-100">
                        <div class="section-label text-dark mb-3">Galeria</div>
                        <h2 class="font-heading fs-1 mb-3">Acervo visual da unidade</h2>
                        <p class="text-secondary mb-0">Bloco preparado para exibir galerias de operações, atividades institucionais e registros históricos com destaque editorial.</p>
                    </div>
                </div>
                <div class="col-lg-8">
                    <div class="row g-4">
                        @foreach ($galleryHighlights as $gallery)
                            <div class="col-md-4">
                                <article class="gallery-card animate-fade-in delay-200">
                                    @php
                                        $galleryStyle = ! empty($gallery['cover_image_path'])
                                            ? "background-image: linear-gradient(180deg, rgba(16, 16, 16, 0.14), rgba(16, 16, 16, 0.76)), url('".e(\Illuminate\Support\Facades\Storage::url($gallery['cover_image_path']))."');"
                                            : '';
                                    @endphp
                                    <div class="gallery-cover d-flex align-items-end p-4 text-white {{ ! empty($gallery['cover_image_path']) ? 'has-media' : '' }}" @if ($galleryStyle) style="{{ $galleryStyle }}" @endif>
                                        <h3 class="font-heading fs-1 mb-0">{{ $gallery['title'] }}</h3>
                                    </div>
                                    <div class="p-4">
                                        <p class="text-secondary">{{ $gallery['description'] }}</p>
                                        <div class="small text-secondary mb-3">{{ $gallery['photos_count'] ?? 0 }} fotos cadastradas</div>
                                        @if (! empty($gallery['slug']))
                                            <a href="{{ route('public.galleries.show', $gallery['slug']) }}" class="btn btn-outline-bprv rounded-pill px-4">Abrir galeria</a>
                                        @endif
                                    </div>
                                </article>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="section-shell pt-0">
        <div class="container">
            <div class="quote-band p-4 p-lg-5">
                <div class="row g-4 align-items-center">
                    <div class="col-lg-8">
                        <div class="section-label mb-3">Frase institucional</div>
                        <blockquote class="mb-0 display-6 font-heading">“Servir com disciplina, proteger com presença e comunicar com responsabilidade.”</blockquote>
                    </div>
                    <div class="col-lg-4 text-lg-end">
                        <span class="site-subtitle text-white-50">Portal institucional • Fase 4</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="section-shell pt-0">
        <div class="container">
            <div class="section-card p-4 p-lg-5 animate-fade-in delay-100">
                <div class="row g-4 align-items-center">
                    <div class="col-lg-8">
                        <div class="section-label text-dark mb-3">Contato e atendimento</div>
                        <h2 class="font-heading display-6 mb-3">Canal institucional preparado para evoluir com conteúdo oficial e serviços de informação</h2>
                        <p class="mb-0 text-secondary fs-5">O portal já está estruturado para crescer com novas páginas, comunicados, registros fotográficos e orientações institucionais em um padrão visual uniforme.</p>
                    </div>
                    <div class="col-lg-4">
                        <div class="contact-panel">
                            <div class="contact-panel__item">
                                <span class="site-subtitle">Localização</span>
                                <strong>{{ $settings['address'] ?? 'Sorocaba - SP' }}</strong>
                            </div>
                            <div class="contact-panel__item">
                                <span class="site-subtitle">Telefone</span>
                                <strong>{{ $settings['phone'] ?? '(15) 3333-3140' }}</strong>
                            </div>
                            <div class="contact-panel__item">
                                <span class="site-subtitle">Instagram</span>
                                <a href="{{ $settings['instagram_url'] ?? '#' }}" target="_blank" rel="noopener noreferrer">Acompanhar canal oficial</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
@endsection
