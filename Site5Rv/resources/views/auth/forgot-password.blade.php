<x-guest-layout>
    <div class="mb-4">
        <div class="site-subtitle">Recuperação de acesso</div>
        <h2 class="font-heading fs-1 mb-2">Redefinir senha</h2>
        <p class="text-secondary mb-0">Informe o e-mail da conta para receber o link de redefinição.</p>
    </div>

    @if (session('status'))
        <div class="alert alert-success rounded-4">{{ session('status') }}</div>
    @endif

    <form method="POST" action="{{ route('password.email') }}">
        @csrf

        <div class="mb-4">
            <label for="email" class="form-label fw-semibold">E-mail</label>
            <input id="email" class="form-control form-control-lg rounded-4" type="email" name="email" value="{{ old('email') }}" required autofocus>
            @error('email')
                <div class="text-danger small mt-2">{{ $message }}</div>
            @enderror
        </div>

        <div class="d-grid">
            <button type="submit" class="btn btn-bprv btn-lg rounded-4 py-3">Enviar link de recuperação</button>
        </div>
    </form>
</x-guest-layout>
