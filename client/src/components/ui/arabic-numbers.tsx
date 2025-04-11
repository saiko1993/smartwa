import React from "react";
import { formatNumberAr, formatCurrencyAr, formatDateAr, formatPercentage } from "@/lib/utils";

interface AmountProps {
  value: number;
  currency?: boolean;
  className?: string;
}

export function Amount({ value, currency = true, className }: AmountProps) {
  return (
    <span className={className}>
      {currency ? formatCurrencyAr(value) : formatNumberAr(value)}
    </span>
  );
}

interface DateProps {
  value: string | Date;
  className?: string;
}

export function Date({ value, className }: DateProps) {
  return (
    <span className={className}>
      {formatDateAr(value)}
    </span>
  );
}

interface PercentProps {
  value: number;
  className?: string;
}

export function Percent({ value, className }: PercentProps) {
  return (
    <span className={className}>
      {formatPercentage(value)}
    </span>
  );
}

interface LimitDisplayProps {
  remaining: number;
  total: number;
  className?: string;
  showText?: boolean;
}

export function LimitDisplay({ remaining, total, className, showText = true }: LimitDisplayProps) {
  const percentage = Math.round((remaining / total) * 100);
  
  let colorClass = "";
  if (percentage > 60) {
    colorClass = "progress-bar-fill-high";
  } else if (percentage > 30) {
    colorClass = "progress-bar-fill-medium";
  } else {
    colorClass = "progress-bar-fill-low";
  }
  
  return (
    <div className={className}>
      {showText && (
        <div className="flex justify-between items-center mb-1.5 text-sm">
          <span className="text-muted-foreground">الحد المتبقي</span>
          <span className="font-medium">
            {formatNumberAr(remaining)} / {formatNumberAr(total)}
          </span>
        </div>
      )}
      <div className="progress-bar">
        <div className={colorClass} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

interface TransactionAmountProps {
  amount: number;
  type: string;
  className?: string;
}

export function TransactionAmount({ amount, type, className }: TransactionAmountProps) {
  const isPositive = type === "deposit" || (type === "transfer" && amount > 0);
  const displayAmount = isPositive ? amount : Math.abs(amount);
  
  return (
    <span className={`font-cairo font-bold ${isPositive ? "text-mahfazhati-success" : "text-mahfazhati-error"} ${className}`}>
      {isPositive ? "+" : "-"}{formatCurrencyAr(displayAmount)}
    </span>
  );
}

interface TransactionTypeProps {
  type: string;
  className?: string;
}

export function TransactionType({ type, className }: TransactionTypeProps) {
  let bgColor, textColor, label, icon;
  
  switch (type) {
    case "deposit":
      bgColor = "bg-mahfazhati-success/10";
      textColor = "text-mahfazhati-success";
      label = "إيداع";
      break;
    case "withdrawal":
      bgColor = "bg-mahfazhati-error/10";
      textColor = "text-mahfazhati-error";
      label = "سحب";
      break;
    case "transfer":
      bgColor = "bg-mahfazhati-info/10";
      textColor = "text-mahfazhati-info";
      label = "تحويل";
      break;
    default:
      bgColor = "bg-muted";
      textColor = "text-muted-foreground";
      label = "معاملة";
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} ${className}`}>
      {label}
    </span>
  );
}
