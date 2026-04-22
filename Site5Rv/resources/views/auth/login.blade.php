<x-guest-layout>
    <div class="mb-4">
        <div class="site-subtitle">Identificação do usuário</div>
        <h2 class="font-heading fs-1 mb-2">Entrar no painel</h2>
        <p class="text-secondary mb-0">Use sua conta institucional para acessar a área administrativa.</p>
    </div>

    @if (session('status'))
        <div class="alert alert-success rounded-4">{{ session('status') }}</div>
    @endif

    <form method="POST" action="{{ route('login') }}">
        @csrf

        <div class="mb-3">
            <label for="email" class="form-label fw-semibold">E-mail</label>
            <input id="email" class="form-control form-control-lg rounded-4" type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username">
            @error('email')
                <div class="text-danger small mt-2">{{ $message }}</div>
            @enderror
        </div>

        <div class="mb-3">
            <label for="password" class="form-label fw-semibold">Senha</label>
            <input id="password" class="form-control form-control-lg rounded-4" type="password" name="password" required autocomplete="current-password">
            @error('password')
                <div class="text-danger small mt-2">{{ $message }}</div>
            @enderror
        </div>

        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <label for="remember_me" class="form-check mb-0">
                <input id="remember_me" type="checkbox" class="form-check-input" name="remember">
                <span class="form-check-label">Manter conectado</span>
            </label>

            @if (Route::has('password.request'))
                <a class="text-decoration-none text-secondary" href="{{ route('password.request') }}">
                    Recuperar acesso
                </a>
            @endif
        </div>

        <div class="d-grid">
            <button type="submit" class="btn btn-bprv btn-lg rounded-4 py-3">Entrar</button>
        </div>
    </form>
</x-guest-layout>
