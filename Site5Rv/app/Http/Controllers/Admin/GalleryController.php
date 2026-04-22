<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGalleryRequest;
use App\Http\Requests\Admin\UpdateGalleryRequest;
use App\Models\Gallery;
use App\Models\GalleryPhoto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

class GalleryController extends Controller
{
    public function index(): View
    {
        return view('admin.galleries.index', [
            'galleries' => Gallery::query()->withCount('photos')->latest()->paginate(12),
        ]);
    }

    public function create(): View
    {
        return view('admin.galleries.create', [
            'gallery' => new Gallery([
                'status' => 'draft',
                'published_at' => now()->format('Y-m-d\TH:i'),
            ]),
        ]);
    }

    public function store(StoreGalleryRequest $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $gallery = Gallery::create($data);
        $this->storePhotos($request, $gallery);

        return redirect()->route('admin.galleries.edit', $gallery)->with('status', 'Galeria criada com sucesso.');
    }

    public function edit(Gallery $gallery): View
    {
        $gallery->load('photos');

        return view('admin.galleries.edit', compact('gallery'));
    }

    public function update(UpdateGalleryRequest $request, Gallery $gallery): RedirectResponse
    {
        $data = $this->validatedData($request, $gallery);
        $data['updated_by'] = $request->user()->id;

        $gallery->update($data);
        $this->storePhotos($request, $gallery);

        return redirect()->route('admin.galleries.edit', $gallery)->with('status', 'Galeria atualizada com sucesso.');
    }

    public function destroy(Gallery $gallery): RedirectResponse
    {
        $gallery->delete();

        return redirect()->route('admin.galleries.index')->with('status', 'Galeria removida com sucesso.');
    }

    public function destroyPhoto(Gallery $gallery, GalleryPhoto $photo): RedirectResponse
    {
        abort_unless($photo->gallery_id === $gallery->id, 404);

        $photo->delete();

        return redirect()->route('admin.galleries.edit', $gallery)->with('status', 'Foto removida com sucesso.');
    }

    private function validatedData(StoreGalleryRequest|UpdateGalleryRequest $request, ?Gallery $gallery = null): array
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($request->input('slug', $request->input('title')));
        $data['published_at'] = $data['status'] === 'published' ? ($data['published_at'] ?? now()) : null;

        if ($request->hasFile('cover_image')) {
            $data['cover_image_path'] = $request->file('cover_image')->store('galleries/covers', 'public');
        } elseif ($gallery) {
            $data['cover_image_path'] = $gallery->cover_image_path;
        }

        unset($data['cover_image'], $data['photos'], $data['photo_titles'], $data['photo_captions']);

        return $data;
    }

    private function storePhotos(Request $request, Gallery $gallery): void
    {
        $photos = $request->file('photos', []);
        $titles = $request->input('photo_titles', []);
        $captions = $request->input('photo_captions', []);
        $nextOrder = (int) $gallery->photos()->max('sort_order');

        foreach ($photos as $index => $photo) {
            if (! $photo) {
                continue;
            }

            $nextOrder++;

            $gallery->photos()->create([
                'title' => $titles[$index] ?? null,
                'file_path' => $photo->store('galleries/photos', 'public'),
                'caption' => $captions[$index] ?? null,
                'sort_order' => $nextOrder,
                'is_active' => true,
            ]);
        }
    }
}
