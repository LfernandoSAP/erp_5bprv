<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBannerRequest;
use App\Http\Requests\Admin\UpdateBannerRequest;
use App\Models\Banner;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class BannerController extends Controller
{
    public function index(): View
    {
        return view('admin.banners.index', [
            'banners' => Banner::query()->orderBy('sort_order')->paginate(12),
        ]);
    }

    public function create(): View
    {
        return view('admin.banners.create', [
            'banner' => new Banner([
                'sort_order' => Banner::max('sort_order') + 1,
                'is_active' => true,
            ]),
        ]);
    }

    public function store(StoreBannerRequest $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        Banner::create($data);

        return redirect()->route('admin.banners.index')->with('status', 'Banner criado com sucesso.');
    }

    public function edit(Banner $banner): View
    {
        return view('admin.banners.edit', compact('banner'));
    }

    public function update(UpdateBannerRequest $request, Banner $banner): RedirectResponse
    {
        $data = $this->validatedData($request, $banner);
        $data['updated_by'] = $request->user()->id;

        $banner->update($data);

        return redirect()->route('admin.banners.index')->with('status', 'Banner atualizado com sucesso.');
    }

    public function destroy(Banner $banner): RedirectResponse
    {
        $banner->delete();

        return redirect()->route('admin.banners.index')->with('status', 'Banner removido com sucesso.');
    }

    private function validatedData(StoreBannerRequest|UpdateBannerRequest $request, ?Banner $banner = null): array
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active');

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('banners', 'public');
        } elseif ($banner) {
            $data['image_path'] = $banner->image_path;
        }

        unset($data['image']);

        return $data;
    }
}
