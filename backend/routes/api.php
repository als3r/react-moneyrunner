<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CurrencyController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public authentication routes
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Public currency routes (for dropdown selection)
Route::apiResource('currencies', CurrencyController::class);
Route::post('currencies/exchange-rates', [CurrencyController::class, 'updateExchangeRates']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user/profile', [AuthController::class, 'user']);

    // Account routes
    Route::apiResource('accounts', AccountController::class);

    // Category routes
    Route::apiResource('categories', CategoryController::class);
    Route::get('categories/tree', [CategoryController::class, 'tree']);

    // Tag routes
    Route::apiResource('tags', TagController::class);

    // Transaction routes
    Route::apiResource('transactions', TransactionController::class);
    Route::get('transactions/reports', [TransactionController::class, 'reports']);
});
