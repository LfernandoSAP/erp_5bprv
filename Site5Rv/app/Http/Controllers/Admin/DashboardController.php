<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Gallery;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        return view('admin.dashboard', [
            'stats' => [
                'posts' => $this->safeCount('posts', Post::class),
                'pages' => $this->safeCount('pages', Page::class),
                'banners' => $this->safeCount('banners', Banner::class),
                'galleries' => $this->safeCount('galleries', Gallery::class),
            ],
            'recentPosts' => $this->recentPosts(),
        ]);
    }

    private function safeCount(string $table, string $model): int
    {
        return Schema::hasTable($table) ? $model::count() : 0;
    }

    private function recentPosts()
    {
        if (! Schema::hasTable('posts')) {
            return collect();
        }

        return Post::query()
            ->latest()
            ->limit(5)
            ->get(['title', 'status', 'published_at']);
    }
}
