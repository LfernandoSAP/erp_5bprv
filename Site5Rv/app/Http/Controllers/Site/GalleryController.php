<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use App\Models\Setting;
use Illuminate\View\View;

class GalleryController extends Controller
{
    public function index(): View
    {
        return view('public.galleries.index', [
            'settings' => $this->portalSettings(),
            'galleries' => Gallery::query()
                ->where('status', 'published')
                ->withCount('photos')
                ->orderByDesc('published_at')
                ->paginate(9),
        ]);
    }

    public function show(Gallery $gallery): View
    {
        abort_unless($gallery->status === 'published', 404);

        return view('public.galleries.show', [
            'settings' => $this->portalSettings(),
            'gallery' => $gallery->load(['photos' => fn ($query) => $query->where('is_active', true)]),
        ]);
    }

    private function portalSettings(): array
    {
        return Setting::portalSettings();
    }
}
