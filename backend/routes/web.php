<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/scalar', function () {
    $documentation = config('l5-swagger.default', 'default');
    $docsJson = config("l5-swagger.documentations.{$documentation}.paths.docs_json", 'openapi.json');
    $routeName = "l5-swagger.{$documentation}.docs";
    $openApiUrl = route($routeName, $docsJson);

    return view('scalar', [
        'openApiUrl' => $openApiUrl,
    ]);
})->name('scalar.docs');
