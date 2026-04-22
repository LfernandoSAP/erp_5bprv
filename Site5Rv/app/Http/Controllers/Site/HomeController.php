<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Gallery;
use App\Models\Page;
use App\Models\Post;
use App\Models\Setting;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function index(): View
    {
        return view('public.home', [
            'settings' => $this->portalSettings(),
            'heroBanners' => $this->heroBanners(),
            'latestPosts' => $this->latestPosts(),
            'galleryHighlights' => $this->galleryHighlights(),
            'historyPage' => $this->historyPage(),
        ]);
    }

    private function portalSettings(): array
    {
        return Setting::portalSettings();
    }

    private function heroBanners(): array
    {
        if (Schema::hasTable('banners')) {
            $records = Banner::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->limit(3)
                ->get(['title', 'subtitle', 'link_url', 'image_path']);

            if ($records->isNotEmpty()) {
                return $records->toArray();
            }
        }

        return [
            [
                'title' => 'Fiscalização com foco na preservação da vida',
                'subtitle' => 'Atuação preventiva, orientação aos usuários e presença operacional nas rodovias.',
                'link_url' => route('public.posts.index'),
                'image_path' => null,
            ],
            [
                'title' => 'Policiamento ostensivo rodoviário especializado',
                'subtitle' => 'Mobilidade, disciplina operacional e resposta rápida em eixos estratégicos.',
                'link_url' => '#historico',
                'image_path' => null,
            ],
            [
                'title' => 'Integração, proximidade e serviço público',
                'subtitle' => 'Comunicação institucional clara, transparente e conectada à sociedade.',
                'link_url' => '#redes-sociais',
                'image_path' => null,
            ],
        ];
    }

    private function latestPosts(): array
    {
        if (Schema::hasTable('posts')) {
            $records = Post::query()
                ->where('status', 'published')
                ->orderByDesc('published_at')
                ->limit(3)
                ->get(['title', 'excerpt', 'slug', 'published_at', 'image_path']);

            if ($records->isNotEmpty()) {
                return $records->toArray();
            }
        }

        return [
            [
                'title' => 'Operação integrada reforça orientação aos motoristas',
                'excerpt' => 'Ações coordenadas em pontos estratégicos com foco em prevenção, fiscalização e educação para o trânsito.',
                'slug' => 'operacao-integrada-reforca-orientacao-aos-motoristas',
                'published_at' => now()->subDays(2),
                'image_path' => null,
            ],
            [
                'title' => 'Batalhão amplia presença institucional em campanhas educativas',
                'excerpt' => 'Iniciativas voltadas à segurança viária e aproximação com a comunidade nas rodovias estaduais.',
                'slug' => 'batalhao-amplia-presenca-institucional-em-campanhas-educativas',
                'published_at' => now()->subDays(5),
                'image_path' => null,
            ],
            [
                'title' => 'Galeria institucional destaca rotina operacional da unidade',
                'excerpt' => 'Registro visual de operações, ações de apoio e atividades de representação institucional.',
                'slug' => 'galeria-institucional-destaca-rotina-operacional-da-unidade',
                'published_at' => now()->subDays(8),
                'image_path' => null,
            ],
        ];
    }

    private function galleryHighlights(): array
    {
        if (Schema::hasTable('galleries')) {
            $records = Gallery::query()
                ->where('status', 'published')
                ->withCount('photos')
                ->orderByDesc('published_at')
                ->limit(3)
                ->get(['title', 'description', 'slug', 'cover_image_path']);

            if ($records->isNotEmpty()) {
                return $records->toArray();
            }
        }

        return [
            ['title' => 'Operações Rodoviárias', 'description' => 'Ações de fiscalização e policiamento em eixos estratégicos.', 'slug' => null, 'cover_image_path' => null, 'photos_count' => 0],
            ['title' => 'Atividades Institucionais', 'description' => 'Solenidades, campanhas e agenda oficial da unidade.', 'slug' => null, 'cover_image_path' => null, 'photos_count' => 0],
            ['title' => 'Integração Operacional', 'description' => 'Registros de apoio conjunto e presença tática nas rodovias.', 'slug' => null, 'cover_image_path' => null, 'photos_count' => 0],
        ];
    }

    private function historyPage(): ?array
    {
        if (! Schema::hasTable('pages')) {
            return [
                'title' => 'Histórico institucional',
                'excerpt' => 'Unidade especializada no policiamento ostensivo rodoviário, voltada à preservação da vida, da ordem pública e da segurança viária nas rodovias sob responsabilidade do batalhão.',
                'slug' => null,
            ];
        }

        $page = Page::query()
            ->where('status', 'published')
            ->whereIn('slug', ['historico-institucional', 'historico'])
            ->first()
            ?? Page::query()->where('status', 'published')->latest('published_at')->first();

        if (! $page) {
            return null;
        }

        return [
            'title' => $page->title,
            'excerpt' => $page->excerpt ?: str($page->content)->limit(260)->toString(),
            'slug' => $page->slug,
        ];
    }
}
