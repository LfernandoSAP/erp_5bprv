<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Requests\Admin\UpdatePostRequest;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\View\View;

class PostController extends Controller
{
    public function index(): View
    {
        return view('admin.posts.index', [
            'posts' => Post::query()->latest()->paginate(12),
        ]);
    }

    public function create(): View
    {
        return view('admin.posts.create', [
            'post' => new Post([
                'status' => 'draft',
                'published_at' => now()->format('Y-m-d\TH:i'),
            ]),
        ]);
    }

    public function store(StorePostRequest $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        Post::create($data);

        return redirect()->route('admin.posts.index')->with('status', 'Notícia criada com sucesso.');
    }

    public function edit(Post $post): View
    {
        return view('admin.posts.edit', compact('post'));
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        $data = $this->validatedData($request, $post);
        $data['updated_by'] = $request->user()->id;

        $post->update($data);

        return redirect()->route('admin.posts.index')->with('status', 'Notícia atualizada com sucesso.');
    }

    public function destroy(Post $post): RedirectResponse
    {
        $post->delete();

        return redirect()->route('admin.posts.index')->with('status', 'Notícia removida com sucesso.');
    }

    private function validatedData(StorePostRequest|UpdatePostRequest $request, ?Post $post = null): array
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['slug'] ?: $data['title']);
        $data['is_featured'] = $request->boolean('is_featured');
        $data['published_at'] = $data['status'] === 'published' ? ($data['published_at'] ?? now()) : null;

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('posts', 'public');
        } elseif ($post) {
            $data['image_path'] = $post->image_path;
        }

        unset($data['image']);

        return $data;
    }
}
