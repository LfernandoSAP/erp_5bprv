<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePageRequest;
use App\Http\Requests\Admin\UpdatePageRequest;
use App\Models\Page;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\View\View;

class PageController extends Controller
{
    public function index(): View
    {
        return view('admin.pages.index', [
            'pages' => Page::query()->latest()->paginate(12),
        ]);
    }

    public function create(): View
    {
        return view('admin.pages.create', [
            'page' => new Page([
                'status' => 'draft',
                'published_at' => now()->format('Y-m-d\TH:i'),
            ]),
        ]);
    }

    public function store(StorePageRequest $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        Page::create($data);

        return redirect()->route('admin.pages.index')->with('status', 'Página criada com sucesso.');
    }

    public function edit(Page $page): View
    {
        return view('admin.pages.edit', compact('page'));
    }

    public function update(UpdatePageRequest $request, Page $page): RedirectResponse
    {
        $data = $this->validatedData($request);
        $data['updated_by'] = $request->user()->id;

        $page->update($data);

        return redirect()->route('admin.pages.index')->with('status', 'Página atualizada com sucesso.');
    }

    public function destroy(Page $page): RedirectResponse
    {
        $page->delete();

        return redirect()->route('admin.pages.index')->with('status', 'Página removida com sucesso.');
    }

    private function validatedData(StorePageRequest|UpdatePageRequest $request): array
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['slug'] ?: $data['title']);
        $data['published_at'] = $data['status'] === 'published' ? ($data['published_at'] ?? now()) : null;

        return $data;
    }
}
