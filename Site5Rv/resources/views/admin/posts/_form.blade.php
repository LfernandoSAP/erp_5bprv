<div class="row g-4">
    <div class="col-lg-8">
        <div class="admin-card p-4 h-100">
            <div class="mb-3">
                <label for="title" class="form-label fw-semibold">Título</label>
                <input type="text" class="form-control rounded-4 @error('title') is-invalid @enderror" id="title" name="title" value="{{ old('title', $post->title) }}" required>
                @error('title')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>

            <div class="mb-3">
                <label for="slug" class="form-label fw-semibold">Slug</label>
                <input type="text" class="form-control rounded-4 @error('slug') is-invalid @enderror" id="slug" name="slug" value="{{ old('slug', $post->slug) }}">
                @error('slug')<div class="invalid-feedback">{{ $message }}</div>@enderror
                <div class="form-text">Opcional. Se ficar em branco, será gerado automaticamente a partir do título.</div>
            </div>

            <div class="mb-3">
                <label for="excerpt" class="form-label fw-semibold">Resumo</label>
                <textarea class="form-control rounded-4 @error('excerpt') is-invalid @enderror" id="excerpt" name="excerpt" rows="4">{{ old('excerpt', $post->excerpt) }}</textarea>
                @error('excerpt')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>

            <div>
                <label for="content" class="form-label fw-semibold">Conteúdo</label>
                <textarea class="form-control rounded-4 @error('content') is-invalid @enderror" id="content" name="content" rows="14" required>{{ old('content', $post->content) }}</textarea>
                @error('content')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        <div class="admin-card p-4 mb-4">
            <div class="mb-3">
                <label for="status" class="form-label fw-semibold">Status</label>
                <select class="form-select rounded-4 @error('status') is-invalid @enderror" id="status" name="status" required>
                    <option value="draft" @selected(old('status', $post->status) === 'draft')>Rascunho</option>
                    <option value="published" @selected(old('status', $post->status) === 'published')>Publicado</option>
                </select>
                @error('status')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>

            <div class="mb-3">
                <label for="published_at" class="form-label fw-semibold">Data de publicação</label>
                <input type="datetime-local" class="form-control rounded-4 @error('published_at') is-invalid @enderror" id="published_at" name="published_at" value="{{ old('published_at', optional($post->published_at)->format('Y-m-d\TH:i') ?? $post->published_at) }}">
                @error('published_at')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>

            <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" role="switch" id="is_featured" name="is_featured" value="1" @checked(old('is_featured', $post->is_featured))>
                <label class="form-check-label" for="is_featured">Marcar como destaque</label>
            </div>

            <div class="mb-3">
                <label for="image" class="form-label fw-semibold">Imagem principal</label>
                <input type="file" class="form-control rounded-4 @error('image') is-invalid @enderror" id="image" name="image" accept=".jpg,.jpeg,.png,.webp">
                @error('image')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>

            @if ($post->image_path)
                <div class="small text-secondary mb-3">Imagem atual: <code>{{ $post->image_path }}</code></div>
            @endif

            <div class="d-grid gap-2">
                <button type="submit" class="btn btn-bprv rounded-pill py-3">Salvar notícia</button>
                <a href="{{ route('admin.posts.index') }}" class="btn btn-outline-bprv rounded-pill py-3">Cancelar</a>
            </div>
        </div>
    </div>
</div>
