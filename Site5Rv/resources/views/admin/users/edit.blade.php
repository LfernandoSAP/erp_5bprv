@extends('layouts.admin')

@section('title', 'Editar Usuário')

@section('content')
    <div class="mb-4">
        <div class="site-subtitle">Controle de acesso</div>
        <h1 class="font-heading display-5 mb-1">Editar usuário</h1>
        <p class="text-secondary mb-0">Atualize perfil, status de acesso e credenciais da conta selecionada.</p>
    </div>

    <form method="POST" action="{{ route('admin.users.update', $user) }}">
        @csrf
        @method('PUT')
        @include('admin.users._form')
    </form>
@endsection
