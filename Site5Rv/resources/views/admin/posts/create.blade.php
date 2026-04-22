@extends('layouts.admin')

@section('title', 'Nova notícia')

@section('content')
    <div class="mb-4">
        <div class="site-subtitle">Módulo editorial</div>
        <h1 class="font-heading display-5 mb-1">Nova notícia</h1>
        <p class="text-secondary mb-0">Cadastre uma nova publicação institucional.</p>
    </div>

    <form method="POST" action="{{ route('admin.posts.store') }}" enctype="multipart/form-data">
        @csrf
        @include('admin.posts._form')
    </form>
@endsection
