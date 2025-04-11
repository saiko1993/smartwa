import React from "react";
import { Card } from "@/components/ui/card";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { formatNumberAr, formatPercentage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, AlertCircle, Calendar, Wallet, ArrowDownLeft, ArrowUpRight, Ban, Scale } from "lucide-react";
import { WalletClassification, WalletClassificationInfo } from "@/lib/smart-planning";

// Interfaces
interface TransactionPatternsCardProps {
  transactionPatterns: ReturnType<typeof useTransactions>["transactionPatterns"];
}

interface SmartRecommendationsCardProps {
  recommendations: string[];
}

interface WalletClassificationCardProps {
  classifiedWallets: WalletClassificationInfo[];
}

// Main component
export function SmartAnalysis() {
  const { walletAnalysis } = useWallets();
  const { transactionPatterns } = useTransactions();
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">التحليل الذكي</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Transaction Patterns Card */}
        <TransactionPatternsCard transactionPatterns={transactionPatterns} />
        
        {/* Smart Recommendations Card */}
        <SmartRecommendationsCard recommendations={walletAnalysis.recommendations} />
      </div>
      
      {/* Wallet Classification Card */}
      <WalletClassificationCard classifiedWallets={walletAnalysis.classifiedWallets || []} />
    </div>
  );
}

// Transaction patterns component
function TransactionPatternsCard({ transactionPatterns }: TransactionPatternsCardProps) {
  const daysOfWeek = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  
  return (
    <Card className="bg-white p-5 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg">أنماط المعاملات</h3>
        <LineChart className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>اليوم الأكثر إيداعاً:</span>
          <span className="font-medium text-success">
            {transactionPatterns.mostActiveDay === "لا يوجد" 
              ? "لا يوجد" 
              : `${transactionPatterns.mostActiveDay} (${formatPercentage(
                  Math.max(...Object.values(transactionPatterns.depositDays || {}))
                )})`
            }
          </span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>اليوم الأكثر سحباً:</span>
          <span className="font-medium text-danger">
            {transactionPatterns.leastActiveDay === "لا يوجد" 
              ? "لا يوجد" 
              : `${transactionPatterns.leastActiveDay} (${formatPercentage(
                  Math.max(...Object.values(transactionPatterns.withdrawalDays || {}))
                )})`
            }
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>متوسط السحب اليومي:</span>
          <span className="font-medium">
            {formatNumberAr(transactionPatterns.dailyAverageWithdrawal)} جنيه
          </span>
        </div>
      </div>
      
      <div className="h-36 flex items-end relative mb-2">
        {/* Simple Bar Chart for Transaction Patterns */}
        <div className="absolute inset-0 flex items-end justify-between px-2">
          {daysOfWeek.map((day, index) => {
            const depositPercentage = transactionPatterns.depositDays[day] || 0;
            const withdrawalPercentage = transactionPatterns.withdrawalDays[day] || 0;
            
            // Scale percentages for visual representation (max height 80%)
            const depositHeight = `${Math.min(depositPercentage, 35)}%`;
            const withdrawalHeight = `${Math.min(withdrawalPercentage, 42)}%`;
            
            return (
              <div key={day} className="flex flex-col items-center w-8">
                <div 
                  className="bg-gray-200 w-full rounded-t-sm" 
                  style={{ height: withdrawalHeight }}
                ></div>
                <div 
                  className="bg-success w-full rounded-b-sm" 
                  style={{ height: depositHeight }}
                ></div>
                <span className="text-xs mt-1">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
          <span>سحب</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-success rounded-sm"></div>
          <span>إيداع</span>
        </div>
      </div>
    </Card>
  );
}

// Smart recommendations component
function SmartRecommendationsCard({ recommendations }: SmartRecommendationsCardProps) {
  return (
    <Card className="bg-white p-5 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg">توصيات ذكية</h3>
        <AlertCircle className="h-5 w-5 text-gray-400" />
      </div>
      
      <ul className="space-y-3">
        {recommendations.length > 0 ? (
          recommendations.map((recommendation, index) => (
            <li key={index} className="flex gap-2 items-start">
              <div className={`h-5 w-5 mt-0.5 ${index % 3 === 0 ? 'text-success' : index % 3 === 1 ? 'text-warning' : 'text-info'} flex-shrink-0`}>
                {index % 3 === 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : index % 3 === 1 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium mb-1">
                  {index === 0 ? "قم بتوزيع رصيدك بشكل أكثر توازناً" : 
                   index === 1 ? "راقب الحد الشهري المتبقي" : 
                   "تحديث الرصيد بانتظام"}
                </p>
                <p className="text-gray-600 text-sm">{recommendation}</p>
              </div>
            </li>
          ))
        ) : (
          <li className="text-center text-gray-500 py-4">
            لا توجد توصيات متاحة حالياً
          </li>
        )}
      </ul>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Button
          variant="ghost" 
          className="text-primary-600 hover:text-primary-800 transition-colors text-sm font-medium flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15V6" />
            <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
            <path d="M12 12H3" />
            <path d="M16 6H3" />
            <path d="M12 18H3" />
          </svg>
          إنشاء تحليل مفصل
        </Button>
      </div>
    </Card>
  );
}

// Wallet classification component
function WalletClassificationCard({ classifiedWallets }: WalletClassificationCardProps) {
  // وظيفة للحصول على لون وأيقونة مناسبة لكل تصنيف
  const getClassificationDetails = (classification: WalletClassification) => {
    switch (classification) {
      case WalletClassification.IdealForSending:
        return {
          color: 'text-green-600 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30',
          iconColor: 'text-green-600',
          icon: <ArrowUpRight className="h-4 w-4" />,
          label: 'مثالية للإرسال',
          badgeClass: 'bg-green-50 text-green-700 border-green-200'
        };
      case WalletClassification.IdealForReceiving:
        return {
          color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30',
          iconColor: 'text-blue-600',
          icon: <ArrowDownLeft className="h-4 w-4" />,
          label: 'مثالية للاستقبال',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case WalletClassification.Balanced:
        return {
          color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/30',
          iconColor: 'text-purple-600',
          icon: <Scale className="h-4 w-4" />,
          label: 'متوازنة',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      case WalletClassification.Unused:
        return {
          color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800/30',
          iconColor: 'text-gray-600',
          icon: <Calendar className="h-4 w-4" />,
          label: 'غير مستغلة',
          badgeClass: 'bg-gray-50 text-gray-700 border-gray-200'
        };
      case WalletClassification.OverLimit:
        return {
          color: 'text-red-600 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30',
          iconColor: 'text-red-600',
          icon: <Ban className="h-4 w-4" />,
          label: 'تجاوزت الحد',
          badgeClass: 'bg-red-50 text-red-700 border-red-200'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800/30',
          iconColor: 'text-gray-600',
          icon: <Wallet className="h-4 w-4" />,
          label: 'غير مصنفة',
          badgeClass: 'bg-gray-50 text-gray-700 border-gray-200'
        };
    }
  };

  return (
    <Card className="overflow-hidden border border-gray-100 mb-6">
      <div className="p-3 border-b bg-gradient-to-r from-purple-50 to-gray-50 dark:from-purple-900/5 dark:to-gray-900/5">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">تصنيف المحافظ</h3>
          <Wallet className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      <div className="p-3">
        {classifiedWallets.length > 0 ? (
          <div className="space-y-3">
            {classifiedWallets.slice(0, 3).map((wallet) => {
              const details = getClassificationDetails(wallet.classification);
              
              return (
                <div key={wallet.walletId} className={`rounded-lg p-2 border ${details.color.split(' ')[2]} ${details.color.split(' ')[3]}`}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-full p-1 ${details.iconColor} bg-white`}>
                        {details.icon}
                      </div>
                      <h4 className="font-medium text-sm">{wallet.name}</h4>
                    </div>
                    <Badge variant="outline" className={`text-xs font-normal ${details.badgeClass}`}>
                      {details.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mr-7">{wallet.reason.length > 60 ? wallet.reason.substring(0, 60) + '...' : wallet.reason}</p>
                </div>
              );
            })}
            
            {classifiedWallets.length > 3 && (
              <p className="text-xs text-center text-purple-600">
                + {classifiedWallets.length - 3} محافظ أخرى
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            لا توجد محافظ لتصنيفها حاليًا
          </div>
        )}
      </div>
    </Card>
  );
}