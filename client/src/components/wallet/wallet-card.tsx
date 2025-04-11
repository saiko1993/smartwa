import React, { useState } from "react";
import { Wallet, Transaction } from "@shared/schema";
import { formatNumberAr, formatDateAr, getWalletTypeColor, getWalletTypeFirstLetter, formatCurrencyAr, getTransactionBadgeColor, formatTransactionAmount, getTransactionLabel, formatPhoneNumber } from "@/lib/utils";
import { Amount } from "@/components/ui/arabic-numbers";
import { Pencil, Trash2, LineChart, ArrowDownLeft, ArrowUpRight, Scale, Calendar, Ban, AlertCircle, Info, RefreshCw, Clock, RotateCcw, ChevronLeft, ChevronRight, Smartphone, CreditCard, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/zustand-store";
import { classifyWallet, WalletClassification } from "@/lib/smart-planning";

interface WalletCardProps {
  wallet: Wallet;
  onEditClick: (wallet: Wallet) => void;
  onUpdateBalanceClick: (wallet: Wallet) => void;
  transactions?: Transaction[]; // إضافة المعاملات
  showInCycleView?: boolean; // عرض مخصص لنظام الدورات
  cycleRole?: 'receive' | 'send' | null; // دور المحفظة في الدورة
}

export function WalletCard({ 
  wallet, 
  onEditClick, 
  onUpdateBalanceClick, 
  transactions = [], 
  showInCycleView = false,
  cycleRole = null
}: WalletCardProps) {
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isInfoMode, setIsInfoMode] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showPinCode, setShowPinCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const { deleteWallet } = useStore();
  
  // تنسيق بطاقة المحفظة بناء على نوعها
  function getWalletCardClass() {
    if (showInCycleView) {
      return cycleRole === 'receive' 
        ? 'wallet-card-receive' 
        : 'wallet-card-send';
    }
    
    const classification = classifyWallet(wallet);
    switch (classification.classification) {
      case WalletClassification.IdealForSending:
        return 'wallet-card-sending';
      case WalletClassification.IdealForReceiving:
        return 'wallet-card-receiving';
      case WalletClassification.OverLimit:
        return 'wallet-card-warning';
      default:
        return 'wallet-card-default';
    }
  }
  
  // قلب البطاقة للخلف (لتأكيد الحذف)
  function toggleCardFlip() {
    if (isInfoMode) {
      setIsInfoMode(false);
      setTimeout(() => {
        setIsCardFlipped(!isCardFlipped);
      }, 200);
    } else {
      setIsCardFlipped(!isCardFlipped);
    }
  }
  
  // تفعيل وضع المعلومات
  function toggleInfoMode(event?: React.MouseEvent) {
    if (isCardFlipped) {
      setIsCardFlipped(false);
      setTimeout(() => {
        setIsInfoMode(!isInfoMode);
      }, 200);
    } else {
      // إذا كانت البطاقة في وضع المعلومات أصلاً، نعود إلى الوضع العادي
      // إذا لم تكن في وضع المعلومات، ننتقل إلى وضع المعلومات
      setIsInfoMode(!isInfoMode);
    }
    // منع الحدث من الانتشار للعناصر الأب
    event?.stopPropagation?.();
  }
  
  // الحصول على تفاصيل الحالة
  function getStatusDetails() {
    // إعادة حساب التصنيف في كل مرة للتأكد من استخدام أحدث البيانات
    const classification = classifyWallet(wallet);
    
    // فحص نسبة الحد المتبقي أولاً
    const remainingLimitPercentage = (wallet.remainingLimit / wallet.monthlyLimit) * 100;
    
    // تصنيف المحفظة بناءً على الرصيد والحد المتبقي
    if (remainingLimitPercentage <= 10) {
      return { 
        label: 'تجاوزت الحد', 
        color: 'bg-red-500 text-white',
        icon: <Ban className="h-4 w-4" />
      };
    } else if (wallet.balance >= 50000 && remainingLimitPercentage >= 50) {
      return { 
        label: 'مثالية للإرسال', 
        color: 'bg-blue-500 text-white',
        icon: <ArrowUpRight className="h-4 w-4" />
      };
    } else if (wallet.balance <= 10000 && remainingLimitPercentage >= 80) {
      return { 
        label: 'مثالية للاستقبال', 
        color: 'bg-green-500 text-white',
        icon: <ArrowDownLeft className="h-4 w-4" />
      };
    } else if (wallet.balance <= 5000 && remainingLimitPercentage >= 95) {
      return { 
        label: 'غير مستغلة', 
        color: 'bg-gray-500 text-white',
        icon: <Calendar className="h-4 w-4" />
      };
    } else if (wallet.balance >= 10000 && wallet.balance <= 50000 && remainingLimitPercentage >= 30) {
      return { 
        label: 'متوازنة', 
        color: 'bg-purple-500 text-white',
        icon: <Scale className="h-4 w-4" />
      };
    } else {
      // إذا لم يكن يتطابق مع أي من الشروط السابقة، استخدم تصنيف الوظيفة الخارجية
      switch (classification.classification) {
        case WalletClassification.IdealForSending:
          return { 
            label: 'مثالية للإرسال', 
            color: 'bg-blue-500 text-white',
            icon: <ArrowUpRight className="h-4 w-4" />
          };
        case WalletClassification.IdealForReceiving:
          return { 
            label: 'مثالية للاستقبال', 
            color: 'bg-green-500 text-white',
            icon: <ArrowDownLeft className="h-4 w-4" />
          };
        case WalletClassification.Balanced:
          return { 
            label: 'متوازنة', 
            color: 'bg-purple-500 text-white',
            icon: <Scale className="h-4 w-4" />
          };
        case WalletClassification.Unused:
          return { 
            label: 'غير مستغلة', 
            color: 'bg-gray-500 text-white',
            icon: <Calendar className="h-4 w-4" />
          };
        case WalletClassification.OverLimit:
          return { 
            label: 'تجاوزت الحد', 
            color: 'bg-red-500 text-white',
            icon: <Ban className="h-4 w-4" />
          };
        default:
          return { 
            label: 'جديدة', 
            color: 'bg-gray-500 text-white',
            icon: <Info className="h-4 w-4" />
          };
      }
    }
  }
  
  // نسخ رقم الهاتف
  function copyPhoneNumber() {
    if (wallet.phoneNumber) {
      navigator.clipboard.writeText(wallet.phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }
  
  // الحصول على آخر المعاملات
  function getLatestTransactions() {
    return transactions
      .filter(t => t.walletId === wallet.id)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }
  
  // الحصول على ملخص المعاملات
  function getTransactionsSummary() {
    const walletTransactions = transactions.filter(t => t.walletId === wallet.id);
    
    const totalCount = walletTransactions.length;
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    walletTransactions.forEach(t => {
      if (t.type === 'deposit') {
        totalDeposits += t.amount;
      } else if (t.type === 'withdrawal') {
        totalWithdrawals += t.amount;
      }
    });
    
    return { totalCount, totalDeposits, totalWithdrawals };
  }
  
  // الحصول على توصية استخدام المحفظة
  function getWalletRecommendation() {
    const classification = classifyWallet(wallet);
    return classification.reason;
  }
  
  // الحصول على فئة شريط التقدم
  function getUsageLimitClass() {
    const remainingPercentage = (wallet.remainingLimit / wallet.monthlyLimit) * 100;
    
    if (remainingPercentage <= 5) {
      return "progress-bar-fill-critical";
    } else if (remainingPercentage <= 15) {
      return "progress-bar-fill-high";
    } else if (remainingPercentage <= 30) {
      return "progress-bar-fill-medium";
    } else {
      return "progress-bar-fill-low";
    }
  }
  
  // الحصول على رسالة تحذير الحد
  function getLimitWarningMessage() {
    const remainingPercentage = (wallet.remainingLimit / wallet.monthlyLimit) * 100;
    
    if (remainingPercentage <= 5) {
      return "الحد المتبقي منخفض جداً، يرجى التحويل قريباً";
    } else if (remainingPercentage <= 15) {
      return "الحد المتبقي منخفض، يجب مراقبة الاستخدام";
    } else if (remainingPercentage <= 30) {
      return "الحد المتبقي متوسط، لا توجد مشكلة حالياً";
    }
    
    return null;
  }
  
  // حذف المحفظة
  function handleDelete() {
    if (deleteWallet) {
      deleteWallet(wallet.id);
      setShowDeleteAlert(false);
      setIsCardFlipped(false);
    }
  }
  
  return (
    <>
      <div className={`wallet-card-container ${showInCycleView ? 'wallet-container-cycle' : ''}`}>
        <div className={`wallet-card ${getWalletCardClass()} ${isInfoMode || isCardFlipped ? "hidden" : ""}`}>
          {(() => {
            // تنسيق خاص لمحافظ الدورات المتتالية
            if (showInCycleView && cycleRole) {
              const cycleLabel = cycleRole === 'receive' ? 'محفظة الاستقبال' : 'محفظة الإرسال';
              const cycleIcon = cycleRole === 'receive' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />;
              const cycleColor = cycleRole === 'receive' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white';
              
              return (
                <div className={`absolute top-0 right-0 left-0 ${cycleColor} py-1 px-3 rounded-t-xl flex items-center justify-center gap-1`}>
                  {cycleIcon}
                  <span className="text-xs font-medium">{cycleLabel}</span>
                </div>
              );
            } 
            
            // تنسيق عادي بناءً على تصنيف المحفظة
            const statusDetails = getStatusDetails();
            return (
              <div className={`absolute top-0 right-0 left-0 ${statusDetails.color} py-1 px-3 rounded-t-xl flex items-center justify-center gap-1`}>
                {statusDetails.icon}
                <span className="text-xs font-medium">{statusDetails.label}</span>
              </div>
            );
          })()}
          
          <div className="flex justify-between mt-5 mb-2">
            {/* جزء العنوان مع أيقونة النوع */}
            <div className="flex items-center gap-1.5">
              <div className={`${getWalletTypeColor(wallet.type)} h-6 w-6 rounded-full flex items-center justify-center text-white font-bold text-xs`}>
                {getWalletTypeFirstLetter(wallet.type)}
              </div>
              <div className="flex flex-col">
                <h3 className="font-cairo font-bold text-base leading-tight">{wallet.name}</h3>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Smartphone className="h-2.5 w-2.5" />
                  شريحة {wallet.simNumber || '1'}
                </span>
              </div>
            </div>
            {/* أزرار الإجراءات */}
            <div className="flex items-center gap-1">
              <button className="icon-button w-5 h-5" onClick={() => onEditClick(wallet)}>
                <Pencil className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button className="icon-button w-5 h-5" onClick={toggleCardFlip}>
                <Trash2 className="h-3.5 w-3.5 text-mahfazhati-error" />
              </button>
            </div>
          </div>
          
          {/* قسم البيانات */}
          <div className="grid grid-cols-2 gap-1.5 bg-muted/20 rounded-md p-1.5 text-xs mb-2">
            {/* رقم الهاتف */}
            <div className="flex items-center justify-between col-span-2 bg-muted/30 p-1 rounded">
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-gray-500" />
                <span className="text-muted-foreground">{formatPhoneNumber(wallet.phoneNumber)}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={copyPhoneNumber}
              >
                {copied ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
              </Button>
            </div>
            
            {/* الرقم السري */}
            <div className="flex items-center justify-between col-span-2 bg-muted/30 p-1 rounded">
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-gray-500" />
                <span className="text-muted-foreground">الرقم السري:</span>
                <span className="font-medium">
                  {wallet.pinCode 
                    ? (showPinCode ? wallet.pinCode : '••••••') 
                    : (showPinCode ? 'غير محدد' : '••••••')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => setShowPinCode(!showPinCode)}
              >
                {showPinCode ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
              </Button>
            </div>
          </div>
          
          {/* الرصيد الحالي والحد الشهري */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-muted/20 p-1.5 rounded-md">
              <div className="text-muted-foreground text-[10px] mb-0.5">الرصيد الحالي</div>
              <Amount value={wallet.balance} className="font-cairo font-bold text-base" />
            </div>
            
            <div className="bg-muted/20 p-1.5 rounded-md">
              <div className="text-muted-foreground text-[10px] mb-0.5">الحد المتبقي</div>
              <div className="font-medium text-xs">{formatNumberAr(wallet.remainingLimit)}</div>
              <div className="progress-bar mt-1 h-1.5">
                <div 
                  className={getUsageLimitClass()} 
                  style={{ 
                    width: `${((wallet.monthlyLimit - wallet.remainingLimit) / wallet.monthlyLimit) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* تنبيهات استخدام الحد */}
          {(() => {
            const warningMessage = getLimitWarningMessage();
            if (!warningMessage) return null;
            
            const usagePercentage = ((wallet.monthlyLimit - wallet.remainingLimit) / wallet.monthlyLimit) * 100;
            let warningClass = "limit-warning ";
            
            if (usagePercentage >= 95) {
              warningClass += "limit-warning-critical";
            } else if (usagePercentage >= 85) {
              warningClass += "limit-warning-high";
            } else {
              warningClass += "limit-warning-medium";
            }
            
            return (
              <div className={warningClass}>
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs">{warningMessage}</span>
              </div>
            );
          })()}
          
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                className="text-mahfazhati-success hover:text-mahfazhati-success/80 p-0 h-auto font-medium"
                onClick={() => onUpdateBalanceClick(wallet)}
              >
                <svg className="h-5 w-5 ml-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M12 5L6 11M12 5L18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-base font-bold">تحديث الرصيد</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground text-sm p-0 h-auto font-medium"
              asChild
            >
              <Link href={`/wallet/${wallet.id}`} className="flex items-center">
                <LineChart className="h-5 w-5 ml-1.5" />
                <span className="text-base font-bold">تفاصيل</span>
              </Link>
            </Button>
          </div>
        </div>
        
        {/* وجه معلومات البطاقة */}
        <div className={`wallet-card wallet-card-info text-right ${getWalletCardClass()} ${!isInfoMode || isCardFlipped ? "hidden" : ""}`} dir="rtl">
          {/* شريط الحالة في وجه المعلومات */}
          <div className={`absolute top-0 right-0 left-0 bg-blue-500 text-white py-1 px-3 rounded-t-xl flex items-center justify-center gap-1`}>
            <span className="text-xs font-medium ml-1">معلومات المحفظة</span>
            <Info className="h-4 w-4" />
          </div>
          
          <div className="mt-6">
            <div className="flex flex-row-reverse justify-between items-center mb-4">
              <h3 className="font-cairo font-bold text-lg">{wallet.name}</h3>
              <Button 
                size="sm"
                variant="ghost" 
                className="p-0 h-6 w-6" 
                onClick={(e) => toggleInfoMode(e)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* معلومات الهاتف والمحفظة */}
            <div className="rounded-md bg-muted/50 p-2 mb-3">
              <div className="flex flex-col space-y-1.5">
                <div className="flex flex-row-reverse items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{wallet.simNumber || '1'}</span>
                    <span className="text-xs text-muted-foreground">:الشريحة</span>
                    <Smartphone className="h-3 w-3 text-gray-600" />
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground">{formatPhoneNumber(wallet.phoneNumber)}</span>
                  </div>
                </div>
                
                <div className="flex flex-row-reverse items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setShowPinCode(!showPinCode)}
                  >
                    {showPinCode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">
                      {wallet.pinCode 
                        ? (showPinCode ? wallet.pinCode : '••••••') 
                        : (showPinCode ? 'غير محدد' : '••••••')}
                    </span>
                    <span className="text-xs text-muted-foreground">:الرقم السري</span>
                    <CreditCard className="h-3 w-3 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* ملخص المعاملات */}
            <div className="rounded-md bg-muted/50 p-2 mb-3 text-right">
              <h4 className="font-bold text-sm mb-2">ملخص المعاملات</h4>
              
              {(() => {
                const summary = getTransactionsSummary();
                return (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">عدد المعاملات</p>
                      <p className="font-bold">{formatNumberAr(summary.totalCount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">الإيداعات</p>
                      <p className="font-bold text-mahfazhati-success">{formatCurrencyAr(summary.totalDeposits)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">السحوبات</p>
                      <p className="font-bold text-mahfazhati-error">{formatCurrencyAr(summary.totalWithdrawals)}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* آخر المعاملات */}
            <div className="mb-3 text-right">
              <h4 className="font-bold text-sm mb-1">آخر المعاملات</h4>
              {(() => {
                const latestTransactions = getLatestTransactions();
                if (latestTransactions.length === 0) {
                  return (
                    <div className="text-center p-2 bg-muted/30 rounded-md">
                      <p className="text-xs text-muted-foreground">لا توجد معاملات حتى الآن</p>
                    </div>
                  )
                }
                
                return (
                  <div className="space-y-1">
                    {latestTransactions.map(transaction => (
                      <div key={transaction.id} className="flex flex-row-reverse items-center justify-between p-1.5 border-b border-border">
                        <div className="text-xs text-muted-foreground">
                          {transaction.date ? formatDateAr(transaction.date) : ''}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">
                            {formatTransactionAmount(transaction.type, transaction.amount)}
                          </span>
                          <Badge variant="outline" className={getTransactionBadgeColor(transaction.type)}>
                            {getTransactionLabel(transaction.type)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            
            {/* توصية استخدام المحفظة */}
            <div className="rounded-md bg-purple-50 dark:bg-purple-900/10 p-2 mb-3 border border-purple-200 dark:border-purple-800/30 text-right">
              <div className="flex flex-row-reverse items-start gap-1.5">
                <div className="bg-purple-100 dark:bg-purple-900/20 rounded-full p-1 mt-0.5">
                  <Scale className="h-3 w-3 text-purple-800 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-xs mb-0.5">توصية الاستخدام</h4>
                  <p className="text-xs text-muted-foreground">{getWalletRecommendation()}</p>
                </div>
              </div>
            </div>
            
            {/* تاريخ آخر تحديث */}
            <div className="flex flex-row-reverse items-center gap-1 justify-center text-xs text-muted-foreground mt-3">
              <span>آخر تحديث: {formatDateAr(wallet.lastUpdated || new Date().toISOString())}</span>
              <Clock className="h-3 w-3 mr-1" />
            </div>
          </div>
        </div>
        
        {/* الوجه الخلفي للبطاقة (تأكيد الحذف) */}
        <div className={`wallet-card delete-confirm bg-red-50 dark:bg-red-900/20 ${getWalletCardClass()} ${!isCardFlipped ? "hidden" : ""}`} dir="rtl">
          {/* شريط الحالة في وجه تأكيد الحذف */}
          <div className={`absolute top-0 right-0 left-0 bg-red-500 text-white py-1 px-3 rounded-t-xl flex items-center justify-center gap-1`}>
            <span className="text-xs font-medium ml-1">تأكيد الحذف</span>
            <Trash2 className="h-4 w-4" />
          </div>
          
          <div className="text-center mt-6">
            <h3 className="font-cairo font-bold text-lg mb-3 text-mahfazhati-error">هل أنت متأكد من حذف هذه المحفظة؟</h3>
            <p className="text-xs text-muted-foreground mb-4">سيتم حذف المحفظة وجميع معاملاتها بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.</p>
            
            <div className="flex flex-row-reverse justify-center gap-3 mt-6">
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-background"
                onClick={toggleCardFlip}
              >
                رجوع
              </Button>
              
              <Button 
                variant="destructive"
                className="bg-mahfazhati-error hover:bg-mahfazhati-error/90"
                onClick={handleDelete}
              >
                تأكيد الحذف
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه المحفظة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المحفظة وجميع معاملاتها بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}