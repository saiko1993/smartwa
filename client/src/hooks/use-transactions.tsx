import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/zustand-store";
import { Transaction } from "@shared/schema";
import { analyzeTransactionPatterns } from "@/lib/smart-planning";

/**
 * Type for transaction filtering options
 */
type TransactionFilterOptions = {
  walletId?: string;
  type?: "deposit" | "withdrawal" | "transfer" | "all";
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
};

/**
 * Custom hook for working with transactions
 */
export function useTransactions(options: TransactionFilterOptions = {}) {
  const { 
    transactions,
    wallets,
    fetchTransactions,
    fetchWallets
  } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.page || 1);
  const [pageSize] = useState(options.pageSize || 10);
  
  // Fetch transactions on component mount
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTransactions(), fetchWallets()]);
        setError(null);
      } catch (err) {
        setError("فشل في تحميل المعاملات");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadTransactions();
  }, [fetchTransactions, fetchWallets]);
  
  // Filter transactions based on the provided options
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by wallet ID if specified
    if (options.walletId && transaction.walletId !== options.walletId) {
      return false;
    }
    
    // Filter by transaction type if specified
    if (options.type && options.type !== "all" && transaction.type !== options.type) {
      return false;
    }
    
    // Filter by date range if specified
    if (options.startDate) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(options.startDate);
      if (transactionDate < startDate) {
        return false;
      }
    }
    
    if (options.endDate) {
      const transactionDate = new Date(transaction.date);
      const endDate = new Date(options.endDate);
      endDate.setHours(23, 59, 59, 999); // End of the day
      if (transactionDate > endDate) {
        return false;
      }
    }
    
    // Filter by amount range if specified
    const absAmount = Math.abs(transaction.amount);
    if (options.minAmount !== undefined && absAmount < options.minAmount) {
      return false;
    }
    
    if (options.maxAmount !== undefined && absAmount > options.maxAmount) {
      return false;
    }
    
    return true;
  });
  
  // Sort transactions by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Paginate transactions
  const totalPages = Math.ceil(sortedTransactions.length / pageSize);
  const paginatedTransactions = sortedTransactions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  
  // Get transaction patterns
  const transactionPatterns = analyzeTransactionPatterns(transactions);
  
  // Function to get wallet name for a transaction
  const getWalletName = useCallback((walletId: string): string => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : "محفظة غير معروفة";
  }, [wallets]);
  
  // Navigation functions
  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  return {
    transactions: paginatedTransactions,
    loading,
    error,
    page,
    totalPages,
    totalTransactions: filteredTransactions.length,
    goToNextPage,
    goToPreviousPage,
    getWalletName,
    transactionPatterns,
    allTransactions: sortedTransactions,
  };
}
