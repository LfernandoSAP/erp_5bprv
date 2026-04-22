@extends('layouts.admin')

@section('title', 'Editar notícia')

@section('content')
    <div class="mb-4">
        <div class="site-subtitle">Módulo editorial</div>
        <h1 class="font-heading display-5 mb-1">Editar notícia</h1>
        <p class="text-secondary mb-0">Atualize os dados da publicação selecionada.</p>
    </div>

    <form method="POST" action="{{ route('admin.posts.update', $post) }}" enctype="multipart/form-data">
        @csrf
        @method('PUT')
        @include('admin.posts._form')
    </form>
@endsection
