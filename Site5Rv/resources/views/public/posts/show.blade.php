@extends('layouts.public')

@section('title', $post->title.' | 5º BPRv')

@section('content')
    <section class="section-shell pt-5">
        <div class="container">
            <div class="mb-4">
                <a href="{{ route('public.posts.index') }}" class="btn btn-outline-bprv rounded-pill px-4">Voltar às publicações</a>
            </div>

            <article class="section-card p-4 p-lg-5 mb-5">
                <div class="site-subtitle mb-3">Publicação institucional</div>
                <h1 class="section-title mb-3">{{ $post->title }}</h1>
                <div class="text-secondary mb-4">
                    {{ optional($post->published_at)->format('d/m/Y H:i') ?? 'Sem data de publicação' }}
                    @if ($post->author)
                        &bull; {{ $post->author->name }}
                    @endif
                </div>

                @if ($post->excerpt)
                    <p class="lead text-secondary">{{ $post->excerpt }}</p>
                @endif

                @if ($post->image_path)
                    <div class="content-cover rounded-4 mb-4" style="background-image: linear-gradient(180deg, rgba(16, 16, 16, 0.12), rgba(16, 16, 16, 0.7)), url('{{ \Illuminate\Support\Facades\Storage::url($post->image_path) }}');"></div>
                @endif

                <div class="mt-4" style="white-space: pre-line;">{{ $post->content }}</div>
            </article>

            @if ($relatedPosts->isNotEmpty())
                <div>
                    <div class="section-label text-dark mb-3">Outras publicações</div>
                    <div class="row g-4">
                        @foreach ($relatedPosts as $relatedPost)
                            <div class="col-lg-4">
                                <article class="publication-card">
                                    @php
                                        $relatedStyle = $relatedPost->image_path
                                            ? "background-image: linear-gradient(180deg, rgba(16, 16, 16, 0.14), rgba(16, 16, 16, 0.76)), url('".e(\Illuminate\Support\Facades\Storage::url($relatedPost->image_path))."');"
                                            : '';
                                    @endphp
                                    <div class="publication-cover p-4 d-flex align-items-end text-white {{ $relatedPost->image_path ? 'has-media' : '' }}" @if ($relatedStyle) style="{{ $relatedStyle }}" @endif>
                                        <h2 class="font-heading fs-1 mb-0">{{ $relatedPost->title }}</h2>
                                    </div>
                                    <div class="p-4">
                                        <div class="small text-secondary mb-2">{{ optional($relatedPost->published_at)->format('d/m/Y') }}</div>
                                        <a href="{{ route('public.posts.show', $relatedPost) }}" class="btn btn-outline-bprv rounded-pill px-4">Abrir</a>
                                    </div>
                                </article>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        </div>
    </section>
@endsection
