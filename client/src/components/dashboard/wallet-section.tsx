import React, { useState } from "react";
import { WalletCard } from "@/components/wallet/wallet-card";
import { useStore } from "@/lib/zustand-store";
import { AddWalletModal } from "@/components/wallet/add-wallet-modal";
import { UpdateBalanceModal } from "@/components/wallet/update-balance-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { Wallet, walletTypes } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface WalletSectionProps {
  onAddWalletClick: () => void;
}

export function WalletSection({ onAddWalletClick }: WalletSectionProps) {
  const { wallets, sortOption, filterOption, setSortOption, setFilterOption, resetAllMonthlyLimits } = useStore();
  const [selectedWallet, setSelectedWallet] = useState<Wallet | undefined>(undefined);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isUpdateBalanceModalOpen, setIsUpdateBalanceModalOpen] = useState(false);
  const [isResettingLimits, setIsResettingLimits] = useState(false);
  const { toast } = useToast();
  
  const handleEditWallet = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsWalletModalOpen(true);
  };
  
  // وظيفة لإعادة ضبط الحد الشهري المتبقي لجميع المحافظ
  const handleResetMonthlyLimits = async () => {
    if (isResettingLimits) return;
    
    setIsResettingLimits(true);
    try {
      const updatedCount = await resetAllMonthlyLimits();
      
      toast({
        title: 'تم إعادة ضبط الحدود الشهرية',
        description: `تم إعادة ضبط الحد المتبقي لعدد ${updatedCount} محفظة بنجاح.`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إعادة ضبط الحدود الشهرية',
        variant: 'destructive',
      });
    } finally {
      setIsResettingLimits(false);
    }
  };
  

  
  const handleUpdateBalance = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsUpdateBalanceModalOpen(true);
  };
  
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
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">محافظي</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Select 
              value={filterOption} 
              onValueChange={(value) => setFilterOption(value as any)}
            >
              <SelectTrigger className="h-9 pl-8 pr-4 text-sm">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {walletTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <Select 
              value={sortOption} 
              onValueChange={(value) => setSortOption(value as any)}
            >
              <SelectTrigger className="h-9 pl-8 pr-4 text-sm">
                <SelectValue placeholder="الأحدث" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">الأحدث</SelectItem>
                <SelectItem value="balance-desc">الرصيد (تنازلي)</SelectItem>
                <SelectItem value="balance-asc">الرصيد (تصاعدي)</SelectItem>
                <SelectItem value="remaining-limit">الحد المتبقي</SelectItem>
                <SelectItem value="name">الاسم</SelectItem>
              </SelectContent>
            </Select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {sortedWallets.map((wallet) => (
          <WalletCard 
            key={wallet.id} 
            wallet={wallet} 
            onEditClick={handleEditWallet}
            onUpdateBalanceClick={handleUpdateBalance}
          />
        ))}
      </div>
      
      <Button 
        variant="outline" 
        className="flex items-center justify-center py-3 px-4 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg border border-dashed border-gray-300 text-gray-700 font-medium w-full"
        onClick={onAddWalletClick}
      >
        <Plus className="h-5 w-5 ml-2" />
        إضافة محفظة جديدة
      </Button>
      
      <AddWalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => {
          setIsWalletModalOpen(false);
          setSelectedWallet(undefined);
        }}
        walletToEdit={selectedWallet}
      />

      {selectedWallet && (
        <UpdateBalanceModal
          isOpen={isUpdateBalanceModalOpen}
          onClose={() => {
            setIsUpdateBalanceModalOpen(false);
            setSelectedWallet(undefined);
          }}
          wallet={selectedWallet}
        />
      )}
    </div>
  );
}
