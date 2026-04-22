@extends('layouts.admin')

@section('title', 'Novo banner')

@section('content')
    <div class="mb-4">
        <div class="site-subtitle">Destaques da home</div>
        <h1 class="font-heading display-5 mb-1">Novo banner</h1>
        <p class="text-secondary mb-0">Cadastre um novo destaque para a home do portal.</p>
    </div>

    <form method="POST" action="{{ route('admin.banners.store') }}" enctype="multipart/form-data">
        @csrf
        @include('admin.banners._form')
    </form>
@endsection
