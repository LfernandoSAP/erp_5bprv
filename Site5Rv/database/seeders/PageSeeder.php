<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\User;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->where('email', 'admin@example.com')->first();

        if (! $author) {
            return;
        }

        $pages = [
            [
                'title' => 'Histórico Institucional',
                'slug' => 'historico-institucional',
                'excerpt' => 'Síntese da identidade, propósito e trajetória institucional da unidade.',
                'content' => "O 5º Batalhão de Polícia Rodoviária atua com foco na preservação da vida, na segurança viária e na presença ostensiva especializada nas rodovias.\n\nO portal institucional foi estruturado para comunicar ações, conteúdo editorial e registros oficiais com sobriedade e clareza.",
                'status' => 'published',
                'published_at' => now()->subDays(10),
            ],
            [
                'title' => 'Área de Atuação',
                'slug' => 'area-de-atuacao',
                'excerpt' => 'Informações institucionais sobre presença territorial e perfil operacional.',
                'content' => "Conteúdo institucional de referência para descrever o escopo de atuação da unidade.\n\nNa próxima etapa, este texto pode ser refinado com dados operacionais e administrativos oficiais.",
                'status' => 'published',
                'published_at' => now()->subDays(7),
            ],
        ];

        foreach ($pages as $page) {
            Page::query()->updateOrCreate(
                ['slug' => $page['slug']],
                array_merge($page, [
                    'created_by' => $author->id,
                    'updated_by' => $author->id,
                ]),
            );
        }
    }
}
