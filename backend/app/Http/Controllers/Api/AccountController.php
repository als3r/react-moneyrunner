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

        // Filter by description
        if ($request->has('description')) {
            $query->where('description', 'like', '%' . $request->description . '%');
        }

        // Search by description, amount, date, tag, or category
        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                // Check for amount comparison operators
                if (preg_match('/^(>=|<=|>|<)(\d+\.?\d*)$/', $searchTerm, $matches)) {
                    $operator = $matches[1];
                    $amount = floatval($matches[2]);
                    $q->where('amount', $operator, $amount);
                } elseif (preg_match('/^(>=|<=|>|<)(\d{4}-\d{2}-\d{2})$/', $searchTerm, $matches)) {
                    // Date comparison operators
                    $operator = $matches[1];
                    $date = $matches[2];
                    $q->whereDate('date', $operator, $date);
                } elseif (preg_match('/^(>=|<=|>|<)(\d{4}-\d{2}-\d{2})\s+(>=|<=|>|<)(\d{4}-\d{2}-\d{2})\s+(>=|<=|>|<)(\d+\.?\d*)$/', $searchTerm, $matches)) {
                    // Combined search: date + date + amount
                    $date1Operator = $matches[1];
                    $date1 = $matches[2];
                    $date2Operator = $matches[3];
                    $date2 = $matches[4];
                    $amountOperator = $matches[5];
                    $amount = floatval($matches[6]);
                    $q->whereDate('date', $date1Operator, $date1)
                      ->whereDate('date', $date2Operator, $date2)
                      ->where('amount', $amountOperator, $amount);
                } elseif (preg_match('/^(>=|<=|>|<)(\d{4}-\d{2}-\d{2})\s+(>=|<=|>|<)(\d{4}-\d{2}-\d{2})$/', $searchTerm, $matches)) {
                    // Combined search: date + date
                    $date1Operator = $matches[1];
                    $date1 = $matches[2];
                    $date2Operator = $matches[3];
                    $date2 = $matches[4];
                    $q->whereDate('date', $date1Operator, $date1)
                      ->whereDate('date', $date2Operator, $date2);
                } elseif (preg_match('/^(>=|<=|>|<)(\d{4}-\d{2}-\d{2})\s+(>=|<=|>|<)(\d+\.?\d*)\s+(>=|<=|>|<)(\d{4}-\d{2}-\d{2})$/', $searchTerm, $matches)) {
                    // Combined search: date + amount + date
                    $date1Operator = $matches[1];
                    $date1 = $matches[2];
                    $amountOperator = $matches[3];
                    $amount = floatval($matches[4]);
                    $date2Operator = $matches[5];
                    $date2 = $matches[6];
                    $q->whereDate('date', $date1Operator, $date1)
                      ->where('amount', $amountOperator, $amount)
                      ->whereDate('date', $date2Operator, $date2);
                } elseif (preg_match('/^(>=|<=|>|<)(\d{4}-\d{2}-\d{2})\s+(>=|<=|>|<)(\d+\.?\d*)$/', $searchTerm, $matches)) {
                    // Combined search: date operator + amount operator
                    $dateOperator = $matches[1];
                    $date = $matches[2];
                    $amountOperator = $matches[3];
                    $amount = floatval($matches[4]);
                    $q->whereDate('date', $dateOperator, $date)
                      ->where('amount', $amountOperator, $amount);
                } elseif (preg_match('/^(>=|<=|>|<)(\d+\.?\d*)\s+(>=|<=|>|<)(\d{4}-\d{2}-\d{2})$/', $searchTerm, $matches)) {
                    // Combined search: amount operator + date operator
                    $amountOperator = $matches[1];
                    $amount = floatval($matches[2]);
                    $dateOperator = $matches[3];
                    $date = $matches[4];
                    $q->where('amount', $amountOperator, $amount)
                      ->whereDate('date', $dateOperator, $date);
                } elseif (preg_match('/^(>=|<=|>|<)(\d+\.?\d*)\s+(.*)$/', $searchTerm, $matches)) {
                    // Combined search: operator + amount + text
                    $operator = $matches[1];
                    $amount = floatval($matches[2]);
                    $textSearch = trim($matches[3]);
                    $q->where('amount', $operator, $amount)
                      ->where(function ($subQ) use ($textSearch) {
                          $subQ->where('description', 'like', '%' . $textSearch . '%')
                            ->orWhereHas('category', function ($catQ) use ($textSearch) {
                                $catQ->where('name', 'like', '%' . $textSearch . '%');
                            })
                            ->orWhereHas('tags', function ($tagQ) use ($textSearch) {
                                $tagQ->where('name', 'like', '%' . $textSearch . '%');
                            });
                      });
                } elseif (preg_match('/^(>=|<=|>|<)(\d{4}-\d{2}-\d{2})\s+(.*)$/', $searchTerm, $matches)) {
                    // Combined search: operator + date + text
                    $operator = $matches[1];
                    $date = $matches[2];
                    $textSearch = trim($matches[3]);
                    $q->whereDate('date', $operator, $date)
                      ->where(function ($subQ) use ($textSearch) {
                          $subQ->where('description', 'like', '%' . $textSearch . '%')
                            ->orWhereHas('category', function ($catQ) use ($textSearch) {
                                $catQ->where('name', 'like', '%' . $textSearch . '%');
                            })
                            ->orWhereHas('tags', function ($tagQ) use ($textSearch) {
                                $tagQ->where('name', 'like', '%' . $textSearch . '%');
                            });
                      });
                } else {
                    // Regular text search
                    $q->where('description', 'like', '%' . $searchTerm . '%')
                      ->orWhere('amount', 'like', '%' . $searchTerm . '%')
                      ->orWhere('date', 'like', '%' . $searchTerm . '%')
                      ->orWhereHas('category', function ($q) use ($searchTerm) {
                          $q->where('name', 'like', '%' . $searchTerm . '%');
                      })
                      ->orWhereHas('tags', function ($q) use ($searchTerm) {
                          $q->where('name', 'like', '%' . $searchTerm . '%');
                      });
                }
            });
        }

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
