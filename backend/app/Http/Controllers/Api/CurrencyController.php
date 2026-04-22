<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CurrencyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $currencies = Currency::where('is_active', true)->get();
        return response()->json($currencies);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:3|unique:currencies',
            'name' => 'required|string|max:100',
            'symbol' => 'required|string|max:5',
            'exchange_rate' => 'required|numeric|min:0',
            'is_default' => 'boolean',
        ]);

        $currency = Currency::create($validated);
        return response()->json($currency, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Currency $currency): JsonResponse
    {
        return response()->json($currency);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Currency $currency): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|max:3|unique:currencies,code,' . $currency->id,
            'name' => 'sometimes|string|max:100',
            'symbol' => 'sometimes|string|max:5',
            'exchange_rate' => 'sometimes|numeric|min:0',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $currency->update($validated);
        return response()->json($currency);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Currency $currency): JsonResponse
    {
        $currency->delete();
        return response()->json(null, 204);
    }

    /**
     * Update exchange rates (admin function)
     */
    public function updateExchangeRates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rates' => 'required|array',
            'rates.*.id' => 'required|exists:currencies,id',
            'rates.*.exchange_rate' => 'required|numeric|min:0',
        ]);

        foreach ($validated['rates'] as $rateData) {
            $currency = Currency::find($rateData['id']);
            $currency->update(['exchange_rate' => $rateData['exchange_rate']]);
        }

        return response()->json(['message' => 'Exchange rates updated successfully']);
    }
}
