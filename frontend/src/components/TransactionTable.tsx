import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "./ui/table";
import Badge from "./ui/badge/Badge";

export interface Transaction {
  id: number;
  description: string;
  amount: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  categoryId: number;
  account: string;
  accountId: number;
  tags: string[];
  tagIds: number[];
}

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  onEdit?: (transaction: Transaction) => void;
  onCategoryClick?: (categoryId: number) => void;
  onTagClick?: (tagId: number) => void;
  selectedCategoryId?: string;
  selectedTagIds?: number[];
  showAccount?: boolean;
  showActions?: boolean;
}

export default function TransactionTable({
  transactions,
  loading,
  onEdit,
  onCategoryClick,
  onTagClick,
  selectedCategoryId,
  selectedTagIds = [],
  showAccount = true,
  showActions = true,
}: TransactionTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Transactions
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Date
                </TableCell>
                {showAccount && (
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Account
                  </TableCell>
                )}
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Category
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Amount
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Tags
                </TableCell>
                {showActions && (
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              <TableRow>
                <TableCell colSpan={showAccount ? 8 : 7} className="py-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Transactions
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Date
                </TableCell>
                {showAccount && (
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Account
                  </TableCell>
                )}
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Category
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Amount
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Tags
                </TableCell>
                {showActions && (
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              <TableRow>
                <TableCell colSpan={showAccount ? 8 : 7} className="py-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Transactions
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              {showAccount && (
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Account
                </TableCell>
              )}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Category
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Amount
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Tags
              </TableCell>
              {showActions && (
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="">
                <TableCell className="py-3">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {transaction.description}
                  </p>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {transaction.date}
                </TableCell>
                {showAccount && (
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {transaction.account}
                  </TableCell>
                )}
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {onCategoryClick ? (
                    <button
                      onClick={() => onCategoryClick(transaction.categoryId)}
                      className={`cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 ${
                        selectedCategoryId === transaction.categoryId.toString()
                          ? "text-brand-500 dark:text-brand-400 font-medium"
                          : ""
                      }`}
                    >
                      {transaction.category}
                    </button>
                  ) : (
                    transaction.category
                  )}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {transaction.amount}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <div className="flex gap-1 flex-wrap">
                    {transaction.tags.map((tag, index) => (
                      onTagClick ? (
                        <button
                          key={index}
                          onClick={() => onTagClick(transaction.tagIds[index])}
                          className="cursor-pointer"
                        >
                          <Badge
                            size="sm"
                            color={selectedTagIds.includes(transaction.tagIds[index]) ? "primary" : "light"}
                          >
                            {tag}
                          </Badge>
                        </button>
                      ) : (
                        <Badge key={index} size="sm" color="light">
                          {tag}
                        </Badge>
                      )
                    ))}
                  </div>
                </TableCell>
                {showActions && onEdit && (
                  <TableCell className="py-3">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
