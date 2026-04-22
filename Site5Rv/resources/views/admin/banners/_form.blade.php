<div class="row g-4">
    <div class="col-lg-8">
        <div class="admin-card p-4 h-100">
            <div class="mb-3">
                <label for="title" class="form-label fw-semibold">Título</label>
                <input type="text" class="form-control rounded-4 @error('title') is-invalid @enderror" id="title" name="title" value="{{ old('title', $banner->title) }}" required>
                @error('title')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>

            <div class="mb-3">
                <label for="subtitle" class="form-label fw-semibold">Subtítulo</label>
                <textarea class="form-control rounded-4 @error('subtitle') is-invalid @enderror" id="subtitle" name="subtitle" rows="4">{{ old('subtitle', $banner->subtitle) }}</textarea>
                @error('subtitle')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>

            <div class="mb-3">
                <label for="link_url" class="form-label fw-semibold">Link</label>
                <input type="url" class="form-control rounded-4 @error('link_url') is-invalid @enderror" id="link_url" name="link_url" value="{{ old('link_url', $banner->link_url) }}">
                @error('link_url')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>

            <div>
                <label for="image" class="form-label fw-semibold">Imagem</label>
                <input type="file" class="form-control rounded-4 @error('image') is-invalid @enderror" id="image" name="image" accept=".jpg,.jpeg,.png,.webp">
                @error('image')<div class="invalid-feedback">{{ $message }}</div>@enderror
                @if ($banner->image_path)
                    <div class="small text-secondary mt-2">Imagem atual: <code>{{ $banner->image_path }}</code></div>
                @endif
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        <div class="admin-card p-4">
            <div class="mb-3">
                <label for="sort_order" class="form-label fw-semibold">Ordem</label>
                <input type="number" class="form-control rounded-4 @error('sort_order') is-invalid @enderror" id="sort_order" name="sort_order" value="{{ old('sort_order', $banner->sort_order) }}" min="0" required>
                @error('sort_order')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>

            <div class="form-check form-switch mb-4">
                <input class="form-check-input" type="checkbox" role="switch" id="is_active" name="is_active" value="1" @checked(old('is_active', $banner->is_active))>
                <label class="form-check-label" for="is_active">Banner ativo</label>
            </div>

            <div class="d-grid gap-2">
                <button type="submit" class="btn btn-bprv rounded-pill py-3">Salvar banner</button>
                <a href="{{ route('admin.banners.index') }}" class="btn btn-outline-bprv rounded-pill py-3">Cancelar</a>
            </div>
        </div>
    </div>
</div>
