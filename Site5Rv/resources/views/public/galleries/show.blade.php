@extends('layouts.public')

@section('title', $gallery->title.' | 5º BPRv')

@section('content')
    <section class="section-shell pt-5">
        <div class="container">
            <div class="mb-4">
                <a href="{{ route('public.galleries.index') }}" class="btn btn-outline-bprv rounded-pill px-4">Voltar às galerias</a>
            </div>

            <article class="section-card p-4 p-lg-5">
                <div class="site-subtitle mb-3">Galeria institucional</div>
                <h1 class="section-title mb-3">{{ $gallery->title }}</h1>
                @if ($gallery->description)
                    <p class="lead text-secondary">{{ $gallery->description }}</p>
                @endif

                @if ($gallery->cover_image_path)
                    <div class="content-cover rounded-4 mb-4" style="background-image: linear-gradient(180deg, rgba(16, 16, 16, 0.12), rgba(16, 16, 16, 0.7)), url('{{ \Illuminate\Support\Facades\Storage::url($gallery->cover_image_path) }}');"></div>
                @endif

                <div class="row g-4 mt-2">
                    @forelse ($gallery->photos as $photo)
                        <div class="col-md-6 col-xl-4">
                            <div class="gallery-card h-100">
                                @php
                                    $photoStyle = $photo->file_path
                                        ? "background-image: linear-gradient(180deg, rgba(16, 16, 16, 0.14), rgba(16, 16, 16, 0.76)), url('".e(\Illuminate\Support\Facades\Storage::url($photo->file_path))."');"
                                        : '';
                                @endphp
                                <div class="gallery-cover d-flex align-items-end p-4 text-white {{ $photo->file_path ? 'has-media' : '' }}" @if ($photoStyle) style="{{ $photoStyle }}" @endif>
                                    <h2 class="font-heading fs-2 mb-0">{{ $photo->title ?: 'Foto institucional' }}</h2>
                                </div>
                                <div class="p-4">
                                    <p class="text-secondary mb-0">{{ $photo->caption ?: 'Registro institucional do 5º BPRv.' }}</p>
                                </div>
                            </div>
                        </div>
                    @empty
                        <div class="col-12">
                            <div class="border rounded-4 p-5 text-center text-secondary">Esta galeria ainda não possui fotos publicadas.</div>
                        </div>
                    @endforelse
                </div>
            </article>
        </div>
    </section>
@endsection
