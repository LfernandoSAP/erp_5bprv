<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\User;
use Illuminate\Database\Seeder;

class BannerSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->where('email', 'admin@example.com')->first();

        if (! $author) {
            return;
        }

        $banners = [
            [
                'title' => 'Fiscalização com foco na preservação da vida',
                'subtitle' => 'Atuação preventiva, orientação aos usuários e presença operacional nas rodovias.',
                'link_url' => '/publicacoes',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'title' => 'Policiamento ostensivo rodoviário especializado',
                'subtitle' => 'Mobilidade, disciplina operacional e resposta rápida em eixos estratégicos.',
                'link_url' => '#historico',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'title' => 'Integração, proximidade e serviço público',
                'subtitle' => 'Comunicação institucional clara, transparente e conectada à sociedade.',
                'link_url' => '#redes-sociais',
                'sort_order' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($banners as $banner) {
            Banner::query()->updateOrCreate(
                ['title' => $banner['title']],
                array_merge($banner, [
                    'created_by' => $author->id,
                    'updated_by' => $author->id,
                ]),
            );
        }
    }
}
