<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->accounts()
            ->with('currency')
            ->where('is_active', true);

        // Apply filters
        if ($request->filled('name')) {
            $query->where('name', 'like', '%' . $request->name . '%');
        }

        // Pagination
        $perPage = $request->input('per_page', 50);
        $page = $request->input('page', 1);

        $accounts = $query->orderBy('name', 'asc')
            ->select('accounts.*')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $accounts->items(),
            'meta' => [
                'current_page' => $accounts->currentPage(),
                'per_page' => $accounts->perPage(),
                'total' => $accounts->total(),
                'last_page' => $accounts->lastPage(),
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
            'type' => 'required|string|max:50',
            'currency_id' => 'required|exists:currencies,id',
            'balance' => 'numeric|min:0',
            'initial_balance' => 'numeric|min:0',
            'description' => 'nullable|string',
        ]);

        // Set initial_balance to balance if not provided
        if (!isset($validated['initial_balance'])) {
            $validated['initial_balance'] = $validated['balance'];
        }

        $account = $request->user()->accounts()->create($validated);
        $account->load('currency');

        return response()->json($account, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Account $account): JsonResponse
    {
        if ($account->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $account->load('currency', 'transactions');
        return response()->json($account);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Account $account): JsonResponse
    {
        if ($account->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:50',
            'currency_id' => 'sometimes|exists:currencies,id',
            'balance' => 'sometimes|numeric|min:0',
            'initial_balance' => 'sometimes|numeric|min:0|nullable',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // If initial_balance is being changed, recalculate the actual balance
        if (isset($validated['initial_balance']) && $validated['initial_balance'] != ($account->initial_balance ?? 0)) {
            $oldInitialBalance = $account->initial_balance ?? 0;
            $newInitialBalance = $validated['initial_balance'];
            $difference = $newInitialBalance - $oldInitialBalance;

            // Calculate current transaction-based balance (excluding initial)
            $income = $account->transactions()->where('type', 'income')->sum('amount');
            $expenses = $account->transactions()->where('type', 'expense')->sum('amount');
            $transfers = $account->transactions()->where('type', 'transfer')->sum('amount');
            $transactionBalance = $income - $expenses - $transfers;

            // New balance = new initial balance + transaction balance
            $validated['balance'] = $newInitialBalance + $transactionBalance;
        }

        $account->update($validated);
        $account->load('currency');

        return response()->json($account);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Account $account): JsonResponse
    {
        if ($account->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $account->delete();
        return response()->json(null, 204);
    }

    /**
     * Recalculate account balance from transaction history
     */
    public function recalculateBalance(Request $request, Account $account): JsonResponse
    {
        if ($account->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Calculate balance from all transactions
        $income = $account->transactions()->where('type', 'income')->sum('amount');
        $expenses = $account->transactions()->where('type', 'expense')->sum('amount');
        $transfers = $account->transactions()->where('type', 'transfer')->sum('amount');

        $calculatedBalance = $income - $expenses - $transfers;

        // Update account balance
        $account->balance = $calculatedBalance;
        $account->save();

        $account->load('currency');
        return response()->json([
            'account' => $account,
            'calculated_balance' => $calculatedBalance,
            'breakdown' => [
                'income' => $income,
                'expenses' => $expenses,
                'transfers' => $transfers,
            ],
        ]);
    }

    /**
     * Get account by hash with transactions
     */
    public function showByHash(Request $request, string $accountHash): JsonResponse
    {
        $account = Account::where('account_hash', $accountHash)->first();

        if (!$account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        if ($account->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $account->load('currency');

        // Get transactions for this account
        $query = $account->transactions()
            ->with(['category', 'tags']);

        // Pagination
        $perPage = $request->input('per_page', 50);
        $page = $request->input('page', 1);

        $transactions = $query->orderBy('date', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'account' => $account,
            'transactions' => [
                'data' => $transactions->items(),
                'meta' => [
                    'current_page' => $transactions->currentPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                    'last_page' => $transactions->lastPage(),
                ],
            ],
        ]);
    }
}
