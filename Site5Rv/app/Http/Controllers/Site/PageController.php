<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Setting;
use Illuminate\View\View;

class PageController extends Controller
{
    public function show(Page $page): View
    {
        abort_unless($page->status === 'published', 404);

        return view('public.pages.show', [
            'settings' => $this->portalSettings(),
            'page' => $page,
        ]);
    }

    private function portalSettings(): array
    {
        return Setting::portalSettings();
    }
}
