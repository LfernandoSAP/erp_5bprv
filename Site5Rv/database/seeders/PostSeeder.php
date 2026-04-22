<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->where('email', 'admin@example.com')->first();

        if (! $author) {
            return;
        }

        $posts = [
            [
                'title' => 'Operação integrada reforça orientação aos motoristas',
                'slug' => 'operacao-integrada-reforca-orientacao-aos-motoristas',
                'excerpt' => 'Ações coordenadas em pontos estratégicos com foco em prevenção, fiscalização e educação para o trânsito.',
                'content' => "Ação institucional de caráter preventivo com foco na segurança viária.\n\nO batalhão reforçou o policiamento em trechos estratégicos, ampliando a presença operacional e a orientação aos usuários das rodovias.",
                'status' => 'published',
                'is_featured' => true,
                'published_at' => now()->subDays(2),
            ],
            [
                'title' => 'Batalhão amplia presença institucional em campanhas educativas',
                'slug' => 'batalhao-amplia-presenca-institucional-em-campanhas-educativas',
                'excerpt' => 'Iniciativas voltadas à segurança viária e aproximação com a comunidade nas rodovias estaduais.',
                'content' => "Campanhas educativas seguem como frente importante de comunicação institucional.\n\nO portal passa a refletir essas ações com linguagem clara e organização editorial própria.",
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now()->subDays(5),
            ],
            [
                'title' => 'Galeria institucional destaca rotina operacional da unidade',
                'slug' => 'galeria-institucional-destaca-rotina-operacional-da-unidade',
                'excerpt' => 'Registro visual de operações, ações de apoio e atividades de representação institucional.',
                'content' => "A futura galeria do portal reunirá material institucional selecionado.\n\nA proposta é valorizar a identidade da unidade com apresentação sóbria e organizada.",
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now()->subDays(8),
            ],
        ];

        foreach ($posts as $post) {
            Post::query()->updateOrCreate(
                ['slug' => $post['slug']],
                array_merge($post, [
                    'created_by' => $author->id,
                    'updated_by' => $author->id,
                ]),
            );
        }
    }
}
