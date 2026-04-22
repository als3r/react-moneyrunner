<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Add login route to satisfy Laravel configuration
Route::get('/login', function () {
    return response()->json(['message' => 'Please use the React frontend for login']);
})->name('login');
