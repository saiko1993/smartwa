import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number to Arabic locale
export function formatNumberAr(num: number): string {
  return new Intl.NumberFormat("ar-EG").format(num);
}

// Format date to Arabic locale
export function formatDateAr(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// Format currency in Arabic style
export function formatCurrencyAr(amount: number): string {
  return `${formatNumberAr(amount)} جنيه`;
}

// Calculate percentage
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

// Format percentage for display
export function formatPercentage(percentage: number): string {
  return `${formatNumberAr(percentage)}٪`;
}

// Get color for remaining limit based on percentage
export function getLimitColor(remainingPercentage: number): string {
  if (remainingPercentage > 60) return "bg-success"; // Green
  if (remainingPercentage > 30) return "bg-warning"; // Yellow/Orange
  return "bg-danger"; // Red
}

// Get status color
export function getStatusColor(status: "success" | "warning" | "error" | "info"): string {
  switch (status) {
    case "success":
      return "bg-success text-success-foreground";
    case "warning":
      return "bg-warning text-warning-foreground";
    case "error":
      return "bg-danger text-danger-foreground";
    case "info":
      return "bg-info text-info-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// Get first letter of wallet type for the avatar
export function getWalletTypeFirstLetter(type: string): string {
  const typeMap: Record<string, string> = {
    "vodafone-cash": "ف",
    "etisalat-cash": "ا",
    "orange-cash": "أ",
    "we-cash": "و",
  };
  
  return typeMap[type] || "م";
}

// Get wallet type color
export function getWalletTypeColor(type: string): string {
  const typeMap: Record<string, string> = {
    "vodafone-cash": "bg-primary-100 text-primary-700",
    "etisalat-cash": "bg-green-100 text-green-700",
    "orange-cash": "bg-orange-100 text-orange-700",
    "we-cash": "bg-purple-100 text-purple-700",
  };
  
  return typeMap[type] || "bg-gray-100 text-gray-700";
}

// Get wallet type full name
export function getWalletTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    "vodafone-cash": "فودافون كاش",
    "etisalat-cash": "اتصالات كاش", 
    "orange-cash": "اورانج كاش",
    "we-cash": "وي كاش",
  };
  
  return typeMap[type] || "محفظة";
}

// Format phone number in a readable way
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return "";
  
  // تحويل الأرقام العربية إلى الإنجليزية أولاً
  const arabicToEnglishMap: { [key: string]: string } = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  // تحويل الأرقام العربية إلى الإنجليزية
  const englishNumberPhone = phoneNumber.replace(/[٠-٩]/g, match => arabicToEnglishMap[match] || match);
  
  // تنسيق الرقم بالترتيب المعتاد من اليمين لليسار: xxxx xxx xx01
  if (englishNumberPhone.length === 11) {
    // بالترتيب من اليمين لليسار للغة العربية
    return `${englishNumberPhone.substring(7)} ${englishNumberPhone.substring(4, 7)} ${englishNumberPhone.substring(0, 4)}`;
  }
  
  // إذا لم يكن الرقم 11 خانة، نعيده كما هو
  return englishNumberPhone;
}

// Create a downloadable JSON file
export function downloadJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Read a file as JSON
export function readFileAsJSON<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// Get transaction badge color
export function getTransactionBadgeColor(type: string): string {
  switch (type) {
    case "deposit":
      return "bg-green-100 text-green-800";
    case "withdrawal":
      return "bg-red-100 text-red-800";
    case "transfer":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Format transaction amount with sign
export function formatTransactionAmount(type: string, amount: number): string {
  if (type === "deposit" || (type === "transfer" && amount > 0)) {
    return `+${formatCurrencyAr(amount)}`;
  }
  return `-${formatCurrencyAr(Math.abs(amount))}`;
}

// Get transaction label by type
export function getTransactionLabel(type: string): string {
  switch (type) {
    case "deposit":
      return "إيداع";
    case "withdrawal":
      return "سحب";
    case "transfer":
      return "تحويل";
    default:
      return "معاملة";
  }
}

// Get current date in ISO format
export function getCurrentDate(): string {
  return new Date().toISOString();
}
