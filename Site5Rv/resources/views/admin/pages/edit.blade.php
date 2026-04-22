@extends('layouts.admin')

@section('title', 'Editar página')

@section('content')
    <div class="mb-4">
        <div class="site-subtitle">Conteúdo institucional</div>
        <h1 class="font-heading display-5 mb-1">Editar página</h1>
        <p class="text-secondary mb-0">Atualize o conteúdo institucional selecionado.</p>
    </div>

    <form method="POST" action="{{ route('admin.pages.update', $page) }}">
        @csrf
        @method('PUT')
        @include('admin.pages._form')
    </form>
@endsection
