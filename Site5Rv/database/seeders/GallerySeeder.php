<?php

namespace Database\Seeders;

use App\Models\Gallery;
use App\Models\User;
use Illuminate\Database\Seeder;

class GallerySeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->where('email', 'admin@example.com')->first();

        if (! $author) {
            return;
        }

        $galleries = [
            [
                'title' => 'Operações Rodoviárias',
                'slug' => 'operacoes-rodoviarias',
                'description' => 'Registros institucionais de ações operacionais e policiamento ostensivo rodoviário.',
                'status' => 'published',
                'published_at' => now()->subDays(6),
            ],
            [
                'title' => 'Atividades Institucionais',
                'slug' => 'atividades-institucionais',
                'description' => 'Eventos, solenidades e momentos de representação institucional da unidade.',
                'status' => 'published',
                'published_at' => now()->subDays(4),
            ],
        ];

        foreach ($galleries as $galleryData) {
            $gallery = Gallery::query()->updateOrCreate(
                ['slug' => $galleryData['slug']],
                array_merge($galleryData, [
                    'created_by' => $author->id,
                    'updated_by' => $author->id,
                ]),
            );

            if ($gallery->photos()->count() === 0) {
                $gallery->photos()->createMany([
                    [
                        'title' => 'Registro operacional',
                        'file_path' => 'galleries/photos/exemplo-operacional.jpg',
                        'caption' => 'Imagem de exemplo para validação inicial da galeria.',
                        'sort_order' => 1,
                        'is_active' => true,
                    ],
                    [
                        'title' => 'Presença institucional',
                        'file_path' => 'galleries/photos/exemplo-institucional.jpg',
                        'caption' => 'Segundo registro de exemplo para composição visual da galeria.',
                        'sort_order' => 2,
                        'is_active' => true,
                    ],
                ]);
            }
        }
    }
}
