@extends('layouts.public')

@section('title', 'Galerias do 5º BPRv')

@section('content')
    <section class="section-shell pt-5">
        <div class="container">
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
                <div>
                    <div class="section-stripe mb-3"></div>
                    <div class="section-label text-dark mb-3">Galerias</div>
                    <h1 class="section-title mb-0">Álbuns e registros visuais institucionais</h1>
                </div>
                <a href="{{ route('public.home') }}" class="btn btn-outline-bprv rounded-pill px-4">Voltar à home</a>
            </div>

            <div class="row g-4">
                @forelse ($galleries as $gallery)
                    <div class="col-lg-4">
                        <article class="gallery-card">
                            @php
                                $galleryStyle = $gallery->cover_image_path
                                    ? "background-image: linear-gradient(180deg, rgba(16, 16, 16, 0.14), rgba(16, 16, 16, 0.76)), url('".e(\Illuminate\Support\Facades\Storage::url($gallery->cover_image_path))."');"
                                    : '';
                            @endphp
                            <div class="gallery-cover d-flex align-items-end p-4 text-white {{ $gallery->cover_image_path ? 'has-media' : '' }}" @if ($galleryStyle) style="{{ $galleryStyle }}" @endif>
                                <h2 class="font-heading fs-1 mb-0">{{ $gallery->title }}</h2>
                            </div>
                            <div class="p-4">
                                <div class="small text-secondary mb-2">{{ $gallery->photos_count }} fotos</div>
                                <p class="text-secondary">{{ $gallery->description }}</p>
                                <a href="{{ route('public.galleries.show', $gallery) }}" class="btn btn-outline-bprv rounded-pill px-4">Abrir galeria</a>
                            </div>
                        </article>
                    </div>
                @empty
                    <div class="col-12"><div class="section-card p-5 text-center text-secondary">Nenhuma galeria disponível no momento.</div></div>
                @endforelse
            </div>

            <div class="pt-4">{{ $galleries->links() }}</div>
        </div>
    </section>
@endsection
