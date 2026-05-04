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
            'category_id' => 'nullable|exists:categories,id',
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
            'category_id' => 'sometimes|nullable|exists:categories,id',
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

    /**
     * Import transactions from CSV file
     */
    public function import(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'account_id' => 'required|exists:accounts,id',
            'preset_id' => 'required|exists:transaction_import_presets,id',
        ]);

        // Validate account belongs to user
        $account = \App\Models\Account::find($validated['account_id']);
        if ($account->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Invalid account'], 422);
        }

        // Validate preset belongs to user
        $preset = \App\Models\ImportPreset::find($validated['preset_id']);
        if ($preset->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Invalid preset'], 422);
        }

        $file = $request->file('file');
        $path = $file->getPathname();

        $csv = array_map('str_getcsv', file($path));
        
        $mapping = $preset->column_mapping;
        $dateFormat = $preset->date_format;
        $skipHeader = $preset->skip_header_row;

        $imported = 0;
        $errors = [];

        $startIndex = $skipHeader ? 1 : 0;

        for ($i = $startIndex; $i < count($csv); $i++) {
            $row = $csv[$i];
            
            try {
                // Map columns based on preset
                $description = $this->getColumnValue($row, $mapping, 'description_column');
                $date = $this->getColumnValue($row, $mapping, 'date_column');
                $type = $this->getColumnValue($row, $mapping, 'type_column') ?? 'auto';
                
                // Handle separate debit/credit columns or single amount column
                $debitColumn = $this->getColumnValue($row, $mapping, 'debit_column');
                $creditColumn = $this->getColumnValue($row, $mapping, 'credit_column');
                $amountColumn = $this->getColumnValue($row, $mapping, 'amount_column');
                
                $amount = 0;
                if (!empty($debitColumn) || !empty($creditColumn)) {
                    // Use separate debit/credit columns
                    $debit = $this->parseAmount($debitColumn ?? 0, $preset->amount_format);
                    $credit = $this->parseAmount($creditColumn ?? 0, $preset->amount_format);
                    
                    if ($debit > 0) {
                        $amount = $debit;
                        $type = 'expense';
                    } elseif ($credit > 0) {
                        $amount = $credit;
                        $type = 'income';
                    } else {
                        $errors[] = "Row " . ($i + 1) . ": No amount in debit or credit column";
                        continue;
                    }
                } elseif (!empty($amountColumn)) {
                    // Use single amount column
                    $amount = $this->parseAmount($amountColumn, $preset->amount_format);
                    
                    // Determine type if not specified (negative amounts are expenses)
                    if ($type === 'auto') {
                        $type = $amount < 0 ? 'expense' : 'income';
                        $amount = abs($amount);
                    }
                } else {
                    $errors[] = "Row " . ($i + 1) . ": No amount column found";
                    continue;
                }
                
                // Parse date
                $date = $this->parseDate($date, $dateFormat);

                // Validate required fields
                if (empty($description) || empty($amount) || empty($date)) {
                    $errors[] = "Row " . ($i + 1) . ": Missing required fields";
                    continue;
                }

                // Create transaction
                $transaction = $request->user()->transactions()->create([
                    'account_id' => $validated['account_id'],
                    'category_id' => null,
                    'type' => $type,
                    'description' => $description,
                    'amount' => $amount,
                    'date' => $date,
                ]);

                // Update account balance
                if ($type === 'income') {
                    $account->balance += $amount;
                } elseif ($type === 'expense') {
                    $account->balance -= $amount;
                }
                $account->save();

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($i + 1) . ": " . $e->getMessage();
            }
        }

        return response()->json([
            'message' => 'Import completed',
            'imported' => $imported,
            'errors' => $errors,
        ]);
    }

    private function getColumnValue($row, $mapping, $key)
    {
        $columnIndex = $mapping[$key] ?? null;
        if ($columnIndex === null) {
            return null;
        }
        return $row[$columnIndex] ?? null;
    }

    private function parseAmount($amount, $format)
    {
        if ($format === 'decimal') {
            return floatval(str_replace([',', '$'], '', $amount));
        }
        return floatval($amount);
    }

    private function parseDate($date, $format)
    {
        $dateTime = \DateTime::createFromFormat($format, $date);
        if ($dateTime === false) {
            // Try common formats
            $formats = ['Y-m-d', 'm/d/Y', 'd/m/Y', 'Y/m/d'];
            foreach ($formats as $fmt) {
                $dateTime = \DateTime::createFromFormat($fmt, $date);
                if ($dateTime !== false) {
                    return $dateTime->format('Y-m-d');
                }
            }
            throw new \Exception("Invalid date format: $date");
        }
        return $dateTime->format('Y-m-d');
    }
}
