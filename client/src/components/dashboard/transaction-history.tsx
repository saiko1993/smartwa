import React from "react";
import { Card } from "@/components/ui/card";
import { useTransactions } from "@/hooks/use-transactions";
import { Transaction as TransactionModel } from "@shared/schema";
import { 
  TransactionAmount, 
  TransactionType, 
  Date as ArabicDate 
} from "@/components/ui/arabic-numbers";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  ChevronUp, 
  ChevronDown 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/zustand-store";

export function TransactionHistory() {
  const { 
    transactions, 
    loading, 
    page, 
    totalPages, 
    goToNextPage, 
    goToPreviousPage, 
    getWalletName 
  } = useTransactions({ pageSize: 5 });
  
  const { deleteTransaction } = useStore();

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">آخر المعاملات</h2>
        <Card className="p-8 text-center">
          جاري التحميل...
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">آخر المعاملات</h2>
      <Card className="overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-right">
              <tr>
                <th className="py-3 px-4 text-sm font-medium text-gray-600 whitespace-nowrap">التاريخ</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-600 whitespace-nowrap">المحفظة</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-600 whitespace-nowrap">النوع</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-600 whitespace-nowrap">المبلغ</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-600 whitespace-nowrap">الوصف</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-600 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length > 0 ? (
                transactions
                  .filter(transaction => transaction.id) // فقط المعاملات التي لها معرف
                  .map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={{...transaction, id: transaction.id as string}}
                      walletName={getWalletName(transaction.walletId)}
                      onDelete={handleDeleteTransaction}
                    />
                  ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    لا توجد معاملات لعرضها
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {transactions.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 flex justify-between items-center border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousPage}
              disabled={page <= 1}
              className="flex items-center text-sm text-gray-700 gap-1 hover:text-primary-600 transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              السابق
            </Button>
            <div className="text-sm text-gray-700">صفحة {page} من {totalPages}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={page >= totalPages}
              className="flex items-center text-sm text-gray-700 gap-1 hover:text-primary-600 transition-colors"
            >
              التالي
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

interface TransactionRowProps {
  transaction: TransactionModel & { id: string };  // Ensure id is always defined
  walletName: string;
  onDelete: (id: string) => void;
}

function TransactionRow({ transaction, walletName, onDelete }: TransactionRowProps) {
  return (
    <tr>
      <td className="py-3 px-4 text-sm text-gray-800 whitespace-nowrap">
        <ArabicDate value={transaction.date || new Date().toISOString()} />
      </td>
      <td className="py-3 px-4 text-sm text-gray-800 whitespace-nowrap">
        {walletName}
      </td>
      <td className="py-3 px-4 text-sm whitespace-nowrap">
        <TransactionType type={transaction.type} />
      </td>
      <td className="py-3 px-4 text-sm font-medium whitespace-nowrap">
        <TransactionAmount amount={transaction.amount} type={transaction.type} />
      </td>
      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
        {transaction.description}
      </td>
      <td className="py-3 px-4 text-left">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary-600 transition-colors">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => transaction.id && onDelete(transaction.id)}>
              حذف المعاملة
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
