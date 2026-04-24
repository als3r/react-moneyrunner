<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Category;
use App\Models\Tag;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            $accounts = $user->accounts;
            $categories = $user->categories;
            $tags = $user->tags;

            $checkingAccount = $accounts->where('name', 'Main Checking')->first();
            $savingsAccount = $accounts->where('name', 'Savings')->first();

            $foodCategory = $categories->where('name', 'Food')->first();
            $transportCategory = $categories->where('name', 'Transport')->first();
            $utilitiesCategory = $categories->where('name', 'Utilities')->first();
            $entertainmentCategory = $categories->where('name', 'Entertainment')->first();
            $healthCategory = $categories->where('name', 'Health')->first();
            $shoppingCategory = $categories->where('name', 'Shopping')->first();
            $educationCategory = $categories->where('name', 'Education')->first();

            $weeklyTag = $tags->where('name', 'weekly')->first();
            $monthlyTag = $tags->where('name', 'monthly')->first();
            $essentialTag = $tags->where('name', 'essential')->first();
            $diningTag = $tags->where('name', 'dining')->first();
            $dailyTag = $tags->where('name', 'daily')->first();
            $seasonalTag = $tags->where('name', 'seasonal')->first();
            $oneTimeTag = $tags->where('name', 'one-time')->first();
            $recurringTag = $tags->where('name', 'recurring')->first();

            $transactions = [
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $foodCategory->id,
                    'type' => 'expense',
                    'description' => 'Grocery shopping',
                    'amount' => 150.00,
                    'date' => '2024-01-15',
                    'tags' => [$weeklyTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $utilitiesCategory->id,
                    'type' => 'expense',
                    'description' => 'Electric bill',
                    'amount' => 85.50,
                    'date' => '2024-01-14',
                    'tags' => [$monthlyTag->id, $essentialTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $entertainmentCategory->id,
                    'type' => 'expense',
                    'description' => 'Netflix subscription',
                    'amount' => 15.99,
                    'date' => '2024-01-13',
                    'tags' => [$monthlyTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $transportCategory->id,
                    'type' => 'expense',
                    'description' => 'Gas station',
                    'amount' => 45.00,
                    'date' => '2024-01-12',
                    'tags' => [$weeklyTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $foodCategory->id,
                    'type' => 'expense',
                    'description' => 'Restaurant dinner',
                    'amount' => 62.50,
                    'date' => '2024-01-11',
                    'tags' => [$diningTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $utilitiesCategory->id,
                    'type' => 'expense',
                    'description' => 'Internet bill',
                    'amount' => 59.99,
                    'date' => '2024-01-10',
                    'tags' => [$monthlyTag->id, $essentialTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $foodCategory->id,
                    'type' => 'expense',
                    'description' => 'Coffee shop',
                    'amount' => 8.50,
                    'date' => '2024-01-09',
                    'tags' => [$dailyTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $healthCategory->id,
                    'type' => 'expense',
                    'description' => 'Gym membership',
                    'amount' => 45.00,
                    'date' => '2024-01-08',
                    'tags' => [$monthlyTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $educationCategory->id,
                    'type' => 'expense',
                    'description' => 'Book purchase',
                    'amount' => 24.99,
                    'date' => '2024-01-07',
                    'tags' => [$oneTimeTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $transportCategory->id,
                    'type' => 'expense',
                    'description' => 'Bus pass',
                    'amount' => 30.00,
                    'date' => '2024-01-06',
                    'tags' => [$monthlyTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $utilitiesCategory->id,
                    'type' => 'expense',
                    'description' => 'Phone bill',
                    'amount' => 40.00,
                    'date' => '2024-01-05',
                    'tags' => [$monthlyTag->id, $essentialTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $shoppingCategory->id,
                    'type' => 'expense',
                    'description' => 'Clothing',
                    'amount' => 120.00,
                    'date' => '2024-01-04',
                    'tags' => [$seasonalTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $foodCategory->id,
                    'type' => 'expense',
                    'description' => 'Weekly groceries',
                    'amount' => 95.00,
                    'date' => '2024-01-03',
                    'tags' => [$weeklyTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $transportCategory->id,
                    'type' => 'expense',
                    'description' => 'Car maintenance',
                    'amount' => 200.00,
                    'date' => '2024-01-02',
                    'tags' => [$oneTimeTag->id],
                ],
                [
                    'account_id' => $checkingAccount->id,
                    'category_id' => $entertainmentCategory->id,
                    'type' => 'expense',
                    'description' => 'Movie tickets',
                    'amount' => 35.00,
                    'date' => '2024-01-01',
                    'tags' => [$diningTag->id],
                ],
            ];

            foreach ($transactions as $transactionData) {
                $transaction = Transaction::create([
                    'user_id' => $user->id,
                    'account_id' => $transactionData['account_id'],
                    'category_id' => $transactionData['category_id'],
                    'type' => $transactionData['type'],
                    'description' => $transactionData['description'],
                    'amount' => $transactionData['amount'],
                    'date' => $transactionData['date'],
                ]);

                if (isset($transactionData['tags'])) {
                    $transaction->tags()->attach($transactionData['tags']);
                }
            }
        }
    }
}
