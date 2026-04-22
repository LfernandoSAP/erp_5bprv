<div class="row g-4">
    <div class="col-lg-8">
        <div class="admin-card p-4 h-100">
            <div class="mb-3">
                <label for="title" class="form-label fw-semibold">Título</label>
                <input type="text" class="form-control rounded-4 @error('title') is-invalid @enderror" id="title" name="title" value="{{ old('title', $gallery->title) }}" required>
                @error('title')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="mb-3">
                <label for="description" class="form-label fw-semibold">Descrição</label>
                <textarea class="form-control rounded-4 @error('description') is-invalid @enderror" id="description" name="description" rows="6">{{ old('description', $gallery->description) }}</textarea>
                @error('description')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="mb-3">
                <label for="cover_image" class="form-label fw-semibold">Imagem de capa</label>
                <input type="file" class="form-control rounded-4 @error('cover_image') is-invalid @enderror" id="cover_image" name="cover_image" accept=".jpg,.jpeg,.png,.webp">
                @error('cover_image')<div class="invalid-feedback">{{ $message }}</div>@enderror
                @if ($gallery->cover_image_path)
                    <div class="small text-secondary mt-2">Capa atual: <code>{{ $gallery->cover_image_path }}</code></div>
                @endif
            </div>
            <div>
                <label class="form-label fw-semibold">Novas fotos da galeria</label>
                <div class="row g-3">
                    @for ($i = 0; $i < 3; $i++)
                        <div class="col-12 border rounded-4 p-3">
                            <input type="file" class="form-control rounded-4 mb-3" name="photos[]" accept=".jpg,.jpeg,.png,.webp">
                            <input type="text" class="form-control rounded-4 mb-3" name="photo_titles[]" placeholder="Título opcional da foto">
                            <textarea class="form-control rounded-4" name="photo_captions[]" rows="2" placeholder="Legenda opcional"></textarea>
                        </div>
                    @endfor
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="admin-card p-4">
            <div class="mb-3">
                <label for="status" class="form-label fw-semibold">Status</label>
                <select class="form-select rounded-4 @error('status') is-invalid @enderror" id="status" name="status" required>
                    <option value="draft" @selected(old('status', $gallery->status) === 'draft')>Rascunho</option>
                    <option value="published" @selected(old('status', $gallery->status) === 'published')>Publicada</option>
                </select>
                @error('status')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="mb-4">
                <label for="published_at" class="form-label fw-semibold">Data de publicação</label>
                <input type="datetime-local" class="form-control rounded-4 @error('published_at') is-invalid @enderror" id="published_at" name="published_at" value="{{ old('published_at', optional($gallery->published_at)->format('Y-m-d\TH:i') ?? $gallery->published_at) }}">
                @error('published_at')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="d-grid gap-2">
                <button type="submit" class="btn btn-bprv rounded-pill py-3">Salvar galeria</button>
                <a href="{{ route('admin.galleries.index') }}" class="btn btn-outline-bprv rounded-pill py-3">Cancelar</a>
            </div>
        </div>

        @if ($gallery->exists && $gallery->photos->isNotEmpty())
            <div class="admin-card p-4 mt-4">
                <h2 class="font-heading fs-3 mb-3">Fotos cadastradas</h2>
                <div class="d-grid gap-3">
                    @foreach ($gallery->photos as $photo)
                        <div class="border rounded-4 p-3">
                            <div class="fw-semibold">{{ $photo->title ?: 'Sem título' }}</div>
                            <div class="small text-secondary mb-2">{{ $photo->caption ?: 'Sem legenda' }}</div>
                            <div class="small text-secondary mb-3"><code>{{ $photo->file_path }}</code></div>
                            <form method="POST" action="{{ route('admin.galleries.photos.destroy', [$gallery, $photo]) }}" onsubmit="return confirm('Deseja remover esta foto?');">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-sm btn-outline-danger rounded-pill px-3">Excluir foto</button>
                            </form>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif
    </div>
</div>
