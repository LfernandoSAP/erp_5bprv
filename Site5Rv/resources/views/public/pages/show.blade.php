@extends('layouts.public')

@section('title', $page->title . ' | 5º BPRv')

@section('content')
    <section class="section-shell pt-5">
        <div class="container">
            <div class="mb-4">
                <a href="{{ route('public.home') }}" class="btn btn-outline-bprv rounded-pill px-4">Voltar à home</a>
            </div>

            <article class="section-card p-4 p-lg-5">
                <div class="site-subtitle mb-3">Página institucional do 5BPRv</div>
                <h1 class="section-title mb-3">{{ $page->title }}</h1>
                @if ($page->excerpt)
                    <p class="lead text-secondary">{{ $page->excerpt }}</p>
                @endif
                <div class="mt-4" style="white-space: pre-line;">{{ $page->content }}</div>
            </article>
        </div>
    </section>
@endsection