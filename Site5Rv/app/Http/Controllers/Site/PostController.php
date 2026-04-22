<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Setting;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\View\View;

class PostController extends Controller
{
    public function index(): View
    {
        return view('public.posts.index', [
            'settings' => $this->portalSettings(),
            'posts' => $this->publishedPosts(),
        ]);
    }

    public function show(Post $post): View
    {
        abort_unless($post->status === 'published', 404);

        return view('public.posts.show', [
            'settings' => $this->portalSettings(),
            'post' => $post,
            'relatedPosts' => Post::query()
                ->where('status', 'published')
                ->whereKeyNot($post->id)
                ->orderByDesc('published_at')
                ->limit(3)
                ->get(),
        ]);
    }

    private function portalSettings(): array
    {
        return Setting::portalSettings();
    }

    private function publishedPosts(): LengthAwarePaginator
    {
        return Post::query()
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->paginate(9);
    }
}
