<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->transactions()
            ->with(['account.currency', 'category', 'tags']);

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by account
        if ($request->has('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by tags
        if ($request->has('tag_ids')) {
            $tagIds = explode(',', $request->tag_ids);
            $query->whereHas('tags', function ($q) use ($tagIds) {
                $q->whereIn('tags.id', $tagIds);
            });
        }

        // Pagination
        $perPage = $request->input('per_page', 50);
        $page = $request->input('page', 1);

        $transactions = $query->orderBy('date', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
                'last_page' => $transactions->lastPage(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'required|exists:categories,id',
            'type' => 'required|in:income,expense,transfer',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'receipt' => 'nullable|string',
            'tag_ids' => 'array',
            'tag_ids.*' => 'exists:tags,id',
        ]);

        // Validate account and category belong to user
        $account = \App\Models\Account::find($validated['account_id']);
        $category = \App\Models\Category::find($validated['category_id']);
        
        if ($account->user_id !== $request->user()->id || $category->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Invalid account or category'], 422);
        }

        $transaction = $request->user()->transactions()->create($validated);

        // Attach tags
        if (isset($validated['tag_ids'])) {
            $transaction->tags()->attach($validated['tag_ids']);
        }

        // Update account balance
        $account = \App\Models\Account::find($validated['account_id']);
        if ($validated['type'] === 'income') {
            $account->balance += $validated['amount'];
        } elseif ($validated['type'] === 'expense') {
            $account->balance -= $validated['amount'];
        } elseif ($validated['type'] === 'transfer') {
            $account->balance -= $validated['amount'];
        }
        $account->save();

        $transaction->load(['account.currency', 'category', 'tags']);
        return response()->json($transaction, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Transaction $transaction): JsonResponse
    {
        if ($transaction->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $transaction->load(['account.currency', 'category', 'tags']);
        return response()->json($transaction);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        if ($transaction->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'account_id' => 'sometimes|exists:accounts,id',
            'category_id' => 'sometimes|exists:categories,id',
            'type' => 'sometimes|in:income,expense,transfer',
            'description' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|min:0',
            'date' => 'sometimes|date',
            'notes' => 'nullable|string',
            'receipt' => 'nullable|string',
            'tag_ids' => 'array',
            'tag_ids.*' => 'exists:tags,id',
        ]);

        // Validate account and category belong to user
        if (isset($validated['account_id'])) {
            $account = \App\Models\Account::find($validated['account_id']);
            if ($account->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Invalid account'], 422);
            }
        }

        if (isset($validated['category_id'])) {
            $category = \App\Models\Category::find($validated['category_id']);
            if ($category->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Invalid category'], 422);
            }
        }

        // Update account balance if amount or type changed
        $oldAccount = $transaction->account;
        $oldAmount = $transaction->amount;
        $oldType = $transaction->type;
        $oldAccountId = $transaction->account_id;

        $transaction->update($validated);

        // Reverse old balance from old account
        if ($oldType === 'income') {
            $oldAccount->balance -= $oldAmount;
        } elseif ($oldType === 'expense') {
            $oldAccount->balance += $oldAmount;
        } elseif ($oldType === 'transfer') {
            $oldAccount->balance += $oldAmount;
        }
        $oldAccount->save();

        // Apply new balance to new account
        $newAccount = isset($validated['account_id'])
            ? \App\Models\Account::find($validated['account_id'])
            : $oldAccount;
        $newAmount = $validated['amount'] ?? $oldAmount;
        $newType = $validated['type'] ?? $oldType;

        if ($newType === 'income') {
            $newAccount->balance += $newAmount;
        } elseif ($newType === 'expense') {
            $newAccount->balance -= $newAmount;
        } elseif ($newType === 'transfer') {
            $newAccount->balance -= $newAmount;
        }
        $newAccount->save();

        // Sync tags
        if (isset($validated['tag_ids'])) {
            $transaction->tags()->sync($validated['tag_ids']);
        }

        $transaction->load(['account.currency', 'category', 'tags']);
        return response()->json($transaction);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        if ($transaction->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Update account balance (reverse the transaction)
        $account = $transaction->account;
        if ($transaction->type === 'income') {
            $account->balance -= $transaction->amount;
        } elseif ($transaction->type === 'expense') {
            $account->balance += $transaction->amount;
        } elseif ($transaction->type === 'transfer') {
            $account->balance += $transaction->amount;
        }
        $account->save();

        $transaction->delete();
        return response()->json(null, 204);
    }

    /**
     * Get expense reports
     */
    public function reports(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'required|in:week,month,year',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'category_ids' => 'array',
            'category_ids.*' => 'exists:categories,id',
            'tag_ids' => 'array',
            'tag_ids.*' => 'exists:tags,id',
        ]);

        $query = $request->user()->transactions()
            ->with(['account.currency', 'category', 'tags'])
            ->whereBetween('date', [$validated['start_date'], $validated['end_date']]);

        // Filter by categories
        if (isset($validated['category_ids'])) {
            $query->whereIn('category_id', $validated['category_ids']);
        }

        // Filter by tags
        if (isset($validated['tag_ids'])) {
            $query->whereHas('tags', function ($q) use ($validated) {
                $q->whereIn('tags.id', $validated['tag_ids']);
            });
        }

        $transactions = $query->get();

        // Calculate totals
        $income = $transactions->where('type', 'income')->sum('amount');
        $expenses_total = $transactions->where('type', 'expense')->sum('amount');
        $balance = $income - $expenses_total;

        // Group by period
        $groupBy = match($validated['period']) {
            'week' => 'WEEK',
            'month' => 'MONTH',
            'year' => 'YEAR',
        };

        $grouped = $transactions->groupBy(function ($transaction) use ($groupBy) {
            return date($groupBy === 'WEEK' ? 'Y-W' : ($groupBy === 'MONTH' ? 'Y-m' : 'Y'), strtotime($transaction->date));
        });

        return response()->json([
            'summary' => [
                'income' => $income,
                'expenses' => $expenses_total,
                'balance' => $balance,
            ],
            'by_period' => $grouped->map(function ($group) {
                return [
                    'income' => $group->where('type', 'income')->sum('amount'),
                    'expenses' => $group->where('type', 'expense')->sum('amount'),
                    'balance' => $group->where('type', 'income')->sum('amount') - $group->where('type', 'expense')->sum('amount'),
                    'transactions' => $group->count(),
                ];
            }),
            'transactions' => $transactions,
        ]);
    }
}
