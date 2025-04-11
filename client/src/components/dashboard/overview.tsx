import React from "react";
import { useStore } from "@/lib/zustand-store";
import { Card } from "@/components/ui/card";
import { Amount, Percent } from "@/components/ui/arabic-numbers";
import { Plus, Wallet, DollarSign, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverviewProps {
  onAddWalletClick: () => void;
}

export function DashboardOverview({ onAddWalletClick }: OverviewProps) {
  const { wallets, transactions } = useStore();
  
  // Calculate total balance
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  
  // Calculate total remaining limit
  const totalRemainingLimit = wallets.reduce((sum, wallet) => sum + wallet.remainingLimit, 0);
  const totalMonthlyLimit = wallets.reduce((sum, wallet) => sum + wallet.monthlyLimit, 0);
  
  // Calculate last month vs current month trend
  const lastMonthTransactions = transactions.filter(t => {
    // في حالة عدم وجود تاريخ للمعاملة، نتخطاها
    if (!t.date) return false;
    try {
      const dateStr = t.date as string;
      const date = new Date(dateStr);
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    } catch (error) {
      return false;
    }
  });
  
  const currentMonthTransactions = transactions.filter(t => {
    // في حالة عدم وجود تاريخ للمعاملة، نتخطاها
    if (!t.date) return false;
    try {
      const dateStr = t.date as string;
      const date = new Date(dateStr);
      const today = new Date();
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    } catch (error) {
      return false;
    }
  });
  
  const lastMonthBalance = lastMonthTransactions.reduce((sum, t) => {
    if (t.type === 'deposit') return sum + t.amount;
    if (t.type === 'withdrawal') return sum - t.amount;
    return sum;
  }, 0);
  
  const currentMonthBalance = currentMonthTransactions.reduce((sum, t) => {
    if (t.type === 'deposit') return sum + t.amount;
    if (t.type === 'withdrawal') return sum - t.amount;
    return sum;
  }, 0);
  
  // Calculate percentage change
  let percentChange = 0;
  if (lastMonthBalance > 0) {
    percentChange = Math.round(((currentMonthBalance - lastMonthBalance) / lastMonthBalance) * 100);
  }
  
  const remainingLimitPercentage = totalMonthlyLimit > 0 
    ? Math.round((totalRemainingLimit / totalMonthlyLimit) * 100)
    : 0;
    
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-purple-50/30 to-gray-50/30 dark:from-purple-900/5 dark:to-gray-900/5">
        {/* رصيد المحافظ */}
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full shadow-sm p-2 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <div className="text-gray-500 text-xs">إجمالي الرصيد</div>
            <div className="flex items-center gap-1">
              <Amount value={totalBalance} className="font-bold" />
              <div className="flex items-center text-xs">
                <div className={`rounded-full w-1.5 h-1.5 ${percentChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`mr-0.5 ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {percentChange >= 0 ? '+' : ''}<Percent value={percentChange} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* الحد المتبقي */}
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full shadow-sm p-2 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <div className="text-gray-500 text-xs">الحد المتبقي</div>
            <div className="flex items-center gap-1">
              <Amount value={totalRemainingLimit} className="font-bold" />
              <div className="flex items-center gap-1 text-xs">
                <div className={`rounded-full w-1.5 h-1.5 ${
                  remainingLimitPercentage > 60 ? 'bg-green-500' : 
                  remainingLimitPercentage > 30 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}></div>
                <span className="text-gray-500">{remainingLimitPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* عدد المحافظ */}
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full shadow-sm p-2 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="text-gray-500 text-xs">المحافظ النشطة</div>
            <div className="flex items-center gap-1">
              <span className="font-bold">{wallets.length}</span>
              <Button 
                variant="ghost"
                className="text-blue-600 text-xs hover:text-blue-800 p-0 h-auto"
                onClick={onAddWalletClick}
              >
                <Plus className="h-3 w-3 ml-0.5" />
                <span className="text-xs">إضافة</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
