<div class="row g-4">
    <div class="col-lg-8">
        <div class="admin-card p-4 h-100">
            <div class="mb-3">
                <label for="name" class="form-label fw-semibold">Nome</label>
                <input type="text" class="form-control rounded-4 @error('name') is-invalid @enderror" id="name" name="name" value="{{ old('name', $user->name) }}" required>
                @error('name')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="mb-3">
                <label for="email" class="form-label fw-semibold">E-mail</label>
                <input type="email" class="form-control rounded-4 @error('email') is-invalid @enderror" id="email" name="email" value="{{ old('email', $user->email) }}" required>
                @error('email')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="row g-3">
                <div class="col-md-6">
                    <label for="password" class="form-label fw-semibold">{{ $user->exists ? 'Nova senha' : 'Senha' }}</label>
                    <input type="password" class="form-control rounded-4 @error('password') is-invalid @enderror" id="password" name="password" {{ $user->exists ? '' : 'required' }}>
                    @error('password')<div class="invalid-feedback">{{ $message }}</div>@enderror
                </div>
                <div class="col-md-6">
                    <label for="password_confirmation" class="form-label fw-semibold">Confirmar senha</label>
                    <input type="password" class="form-control rounded-4" id="password_confirmation" name="password_confirmation" {{ $user->exists ? '' : 'required' }}>
                </div>
            </div>
            @if ($user->exists)
                <div class="small text-secondary mt-3">Deixe os campos de senha em branco para manter a senha atual.</div>
            @endif
        </div>
    </div>
    <div class="col-lg-4">
        <div class="admin-card p-4">
            <div class="mb-3">
                <label for="role" class="form-label fw-semibold">Perfil</label>
                <select class="form-select rounded-4 @error('role') is-invalid @enderror" id="role" name="role" required>
                    <option value="admin" @selected(old('role', $user->role) === 'admin')>Administrador</option>
                    <option value="editor" @selected(old('role', $user->role) === 'editor')>Editor</option>
                </select>
                @error('role')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="form-check form-switch mb-4">
                <input class="form-check-input" type="checkbox" role="switch" id="is_active" name="is_active" value="1" @checked(old('is_active', $user->is_active))>
                <label class="form-check-label" for="is_active">Conta ativa</label>
            </div>
            @if ($user->exists)
                <div class="small text-secondary mb-4">
                    Último acesso:
                    {{ optional($user->last_login_at)->format('d/m/Y H:i') ?? 'ainda não registrado' }}
                </div>
            @endif
            <div class="d-grid gap-2">
                <button type="submit" class="btn btn-bprv rounded-pill py-3">Salvar usuário</button>
                <a href="{{ route('admin.users.index') }}" class="btn btn-outline-bprv rounded-pill py-3">Cancelar</a>
            </div>
        </div>
    </div>
</div>
