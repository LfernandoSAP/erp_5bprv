<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            PortalSettingSeeder::class,
            PageSeeder::class,
            BannerSeeder::class,
            PostSeeder::class,
            GallerySeeder::class,
        ]);
    }
}
