<div class="row g-4">
    <div class="col-lg-8">
        <div class="admin-card p-4 h-100">
            <div class="mb-3">
                <label for="title" class="form-label fw-semibold">Título</label>
                <input type="text" class="form-control rounded-4 @error('title') is-invalid @enderror" id="title" name="title" value="{{ old('title', $page->title) }}" required>
                @error('title')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="mb-3">
                <label for="slug" class="form-label fw-semibold">Slug</label>
                <input type="text" class="form-control rounded-4 @error('slug') is-invalid @enderror" id="slug" name="slug" value="{{ old('slug', $page->slug) }}">
                @error('slug')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="mb-3">
                <label for="excerpt" class="form-label fw-semibold">Resumo</label>
                <textarea class="form-control rounded-4 @error('excerpt') is-invalid @enderror" id="excerpt" name="excerpt" rows="4">{{ old('excerpt', $page->excerpt) }}</textarea>
                @error('excerpt')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div>
                <label for="content" class="form-label fw-semibold">Conteúdo</label>
                <textarea class="form-control rounded-4 @error('content') is-invalid @enderror" id="content" name="content" rows="16" required>{{ old('content', $page->content) }}</textarea>
                @error('content')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="admin-card p-4">
            <div class="mb-3">
                <label for="status" class="form-label fw-semibold">Status</label>
                <select class="form-select rounded-4 @error('status') is-invalid @enderror" id="status" name="status" required>
                    <option value="draft" @selected(old('status', $page->status) === 'draft')>Rascunho</option>
                    <option value="published" @selected(old('status', $page->status) === 'published')>Publicado</option>
                </select>
                @error('status')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="mb-4">
                <label for="published_at" class="form-label fw-semibold">Data de publicação</label>
                <input type="datetime-local" class="form-control rounded-4 @error('published_at') is-invalid @enderror" id="published_at" name="published_at" value="{{ old('published_at', optional($page->published_at)->format('Y-m-d\TH:i') ?? $page->published_at) }}">
                @error('published_at')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="d-grid gap-2">
                <button type="submit" class="btn btn-bprv rounded-pill py-3">Salvar página</button>
                <a href="{{ route('admin.pages.index') }}" class="btn btn-outline-bprv rounded-pill py-3">Cancelar</a>
            </div>
        </div>
    </div>
</div>
