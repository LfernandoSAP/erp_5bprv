@extends('layouts.public')

@section('title', 'Publicações do 5º BPRv')

@section('content')
    <section class="section-shell pt-5">
        <div class="container">
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
                <div>
                    <div class="section-stripe mb-3"></div>
                    <div class="section-label text-dark mb-3">Publicações</div>
                    <h1 class="section-title mb-0">Notícias e comunicados institucionais</h1>
                </div>
                <a href="{{ route('public.home') }}" class="btn btn-outline-bprv rounded-pill px-4">Voltar à home</a>
            </div>

            <div class="row g-4">
                @forelse ($posts as $post)
                    <div class="col-lg-4">
                        <article class="publication-card">
                            @php
                                $cardStyle = $post->image_path
                                    ? "background-image: linear-gradient(180deg, rgba(16, 16, 16, 0.14), rgba(16, 16, 16, 0.76)), url('".e(\Illuminate\Support\Facades\Storage::url($post->image_path))."');"
                                    : '';
                            @endphp
                            <div class="publication-cover p-4 d-flex align-items-end text-white {{ $post->image_path ? 'has-media' : '' }}" @if ($cardStyle) style="{{ $cardStyle }}" @endif>
                                <div>
                                    <div class="site-subtitle text-white-50">Publicação</div>
                                    <h2 class="font-heading fs-1 mb-0">{{ $post->title }}</h2>
                                </div>
                            </div>
                            <div class="p-4">
                                <div class="small text-secondary mb-2">{{ optional($post->published_at)->format('d/m/Y H:i') ?? 'Sem data' }}</div>
                                <p class="text-secondary">{{ $post->excerpt }}</p>
                                <a href="{{ route('public.posts.show', $post) }}" class="btn btn-outline-bprv rounded-pill px-4">Ler publicação</a>
                            </div>
                        </article>
                    </div>
                @empty
                    <div class="col-12">
                        <div class="section-card p-5 text-center text-secondary">Nenhuma publicação disponível no momento.</div>
                    </div>
                @endforelse
            </div>

            <div class="pt-4">
                {{ $posts->links() }}
            </div>
        </div>
    </section>
@endsection
