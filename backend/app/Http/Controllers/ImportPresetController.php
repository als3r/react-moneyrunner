<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ImportPreset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImportPresetController extends Controller
{
    public function index(Request $request)
    {
        $presets = ImportPreset::where('user_id', Auth::id())
            ->orderBy('name')
            ->get();

        return response()->json($presets);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'column_mapping' => 'required|array',
            'date_format' => 'nullable|string',
            'amount_format' => 'nullable|string',
            'skip_header_row' => 'nullable|boolean',
        ]);

        $preset = ImportPreset::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'description' => $request->description,
            'column_mapping' => $request->column_mapping,
            'date_format' => $request->date_format ?? 'Y-m-d',
            'amount_format' => $request->amount_format ?? 'decimal',
            'skip_header_row' => $request->skip_header_row ?? true,
        ]);

        return response()->json($preset, 201);
    }

    public function show($id)
    {
        $preset = ImportPreset::where('user_id', Auth::id())->findOrFail($id);
        return response()->json($preset);
    }

    public function update(Request $request, $id)
    {
        $preset = ImportPreset::where('user_id', Auth::id())->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'column_mapping' => 'required|array',
            'date_format' => 'nullable|string',
            'amount_format' => 'nullable|string',
            'skip_header_row' => 'nullable|boolean',
        ]);

        $preset->update([
            'name' => $request->name,
            'description' => $request->description,
            'column_mapping' => $request->column_mapping,
            'date_format' => $request->date_format ?? 'Y-m-d',
            'amount_format' => $request->amount_format ?? 'decimal',
            'skip_header_row' => $request->skip_header_row ?? true,
        ]);

        return response()->json($preset);
    }

    public function destroy($id)
    {
        $preset = ImportPreset::where('user_id', Auth::id())->findOrFail($id);
        $preset->delete();

        return response()->json(null, 204);
    }
}
