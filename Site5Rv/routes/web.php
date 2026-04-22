<?php

use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\GalleryController as AdminGalleryController;
use App\Http\Controllers\Admin\PageController as AdminPageController;
use App\Http\Controllers\Admin\PostController as AdminPostController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Site\GalleryController;
use App\Http\Controllers\Site\HomeController;
use App\Http\Controllers\Site\PageController;
use App\Http\Controllers\Site\PostController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('public.home');
Route::get('/publicacoes', [PostController::class, 'index'])->name('public.posts.index');
Route::get('/publicacoes/{post:slug}', [PostController::class, 'show'])->name('public.posts.show');
Route::get('/institucional/{page:slug}', [PageController::class, 'show'])->name('public.pages.show');
Route::get('/galerias', [GalleryController::class, 'index'])->name('public.galleries.index');
Route::get('/galerias/{gallery:slug}', [GalleryController::class, 'show'])->name('public.galleries.show');

Route::redirect('/dashboard', '/admin')->middleware('auth')->name('dashboard');

Route::prefix('admin')->name('admin.')->middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('posts', AdminPostController::class)->except('show');
    Route::resource('banners', BannerController::class)->except('show');
    Route::resource('pages', AdminPageController::class)->except('show');
    Route::resource('galleries', AdminGalleryController::class)->except('show');
    Route::delete('galleries/{gallery}/photos/{photo}', [AdminGalleryController::class, 'destroyPhoto'])->name('galleries.photos.destroy');
});

Route::prefix('admin')->name('admin.')->middleware(['auth', 'admin'])->group(function () {
    Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
    Route::resource('users', UserController::class)->except('show');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
