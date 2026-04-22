@extends('layouts.admin')

@section('title', 'Editar galeria')

@section('content')
    @include('admin.partials.status-alert')

    <div class="mb-4">
        <div class="site-subtitle">Galerias institucionais</div>
        <h1 class="font-heading display-5 mb-1">Editar galeria</h1>
        <p class="text-secondary mb-0">Atualize informações, capa e fotos da galeria selecionada.</p>
    </div>

    <form method="POST" action="{{ route('admin.galleries.update', $gallery) }}" enctype="multipart/form-data">
        @csrf
        @method('PUT')
        @include('admin.galleries._form')
    </form>
@endsection
