<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->categories()
            ->with('parent')
            ->where('is_active', true);

        // Pagination
        $perPage = $request->input('per_page', 50);
        $page = $request->input('page', 1);

        $categories = $query->orderBy('name', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $categories->items(),
            'meta' => [
                'current_page' => $categories->currentPage(),
                'per_page' => $categories->perPage(),
                'total' => $categories->total(),
                'last_page' => $categories->lastPage(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
        ]);

        // Validate parent belongs to same user
        if (isset($validated['parent_id']) && $validated['parent_id']) {
            $parent = Category::find($validated['parent_id']);
            if ($parent->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Invalid parent category'], 422);
            }
        }

        $category = $request->user()->categories()->create($validated);
        $category->load('parent');
        
        return response()->json($category, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Category $category): JsonResponse
    {
        if ($category->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $category->load('parent', 'children', 'transactions');
        return response()->json($category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        if ($category->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        // Validate parent belongs to same user and prevent circular reference
        if (isset($validated['parent_id']) && $validated['parent_id']) {
            $parent = Category::find($validated['parent_id']);
            if ($parent->user_id !== $request->user()->id || $parent->id === $category->id) {
                return response()->json(['message' => 'Invalid parent category'], 422);
            }
        }

        $category->update($validated);
        $category->load('parent', 'children');
        
        return response()->json($category);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Category $category): JsonResponse
    {
        if ($category->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if category has children
        if ($category->children()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with subcategories'], 422);
        }

        $category->delete();
        return response()->json(null, 204);
    }

    /**
     * Get category tree structure
     */
    public function tree(Request $request): JsonResponse
    {
        $categories = $request->user()->categories()
            ->with('children')
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->get();
        
        return response()->json($categories);
    }
}
