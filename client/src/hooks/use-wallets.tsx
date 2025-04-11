import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/zustand-store";
import { Wallet } from "@shared/schema";
import { analyzeWallets, generateCyclicStrategy } from "@/lib/smart-planning";

/**
 * Custom hook for working with wallets
 * Provides filtered and sorted wallets, wallet analysis, and cycle strategy
 */
export function useWallets() {
  const { 
    wallets,
    fetchWallets,
    sortOption,
    filterOption
  } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch wallets on component mount
  useEffect(() => {
    const loadWallets = async () => {
      setLoading(true);
      try {
        await fetchWallets();
        setError(null);
      } catch (err) {
        setError("فشل في تحميل المحافظ");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadWallets();
  }, [fetchWallets]);
  
  // Filter wallets based on selected filter
  const filteredWallets = wallets.filter(wallet => {
    if (filterOption === "all") return true;
    return wallet.type === filterOption;
  });
  
  // Sort wallets based on selected sort option
  const sortedWallets = [...filteredWallets].sort((a, b) => {
    switch (sortOption) {
      case "name":
        return a.name.localeCompare(b.name);
      case "balance-asc":
        return a.balance - b.balance;
      case "balance-desc":
        return b.balance - a.balance;
      case "remaining-limit":
        return b.remainingLimit - a.remainingLimit;
      case "date":
      default:
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
  });
  
  // Analyze wallets to get insights
  const walletAnalysis = analyzeWallets(wallets);
  
  // Generate cyclic wallet strategy
  const cyclicStrategy = generateCyclicStrategy(wallets);
  
  // Get wallet by id - useful for details pages
  const getWalletById = useCallback((id: string): Wallet | undefined => {
    return wallets.find(wallet => wallet.id === id);
  }, [wallets]);
  
  return {
    wallets: sortedWallets,
    loading,
    error,
    walletAnalysis,
    cyclicStrategy,
    getWalletById,
    totalWallets: wallets.length,
    totalBalance: walletAnalysis.totalBalance,
    totalRemainingLimit: walletAnalysis.totalRemainingLimit,
    totalLimit: walletAnalysis.totalLimit,
  };
}
