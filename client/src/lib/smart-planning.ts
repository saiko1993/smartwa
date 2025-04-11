import { Wallet, Transaction } from '@shared/schema';

// Smart planning helper functions to analyze wallet data and provide recommendations

// أنواع تصنيف المحافظ
export enum WalletClassification {
  IdealForSending = "محفظة مثالية للإرسال",
  IdealForReceiving = "محفظة مثالية للاستقبال",
  Balanced = "محفظة متوازنة",
  Unused = "محفظة غير مستغلة",
  OverLimit = "محفظة تجاوزت الحد"
}

// واجهة لعرض معلومات تصنيف المحفظة
export interface WalletClassificationInfo {
  walletId: string;
  name: string;
  classification: WalletClassification;
  reason: string;
}

interface WalletAnalysis {
  totalBalance: number;
  totalLimit: number;
  totalRemainingLimit: number;
  walletDistribution: { [key: string]: number }; // Percentage of each wallet
  limitDistribution: { [key: string]: number }; // Percentage of remaining limit
  mostUsedWallet?: string;
  leastUsedWallet?: string;
  limitWarnings: Array<{ walletId: string, name: string, remainingLimitPercentage: number }>;
  balanceImbalance: boolean;
  recommendations: string[];
  classifiedWallets: WalletClassificationInfo[]; // تصنيف المحافظ
}

interface TransactionPattern {
  depositDays: { [key: string]: number }; // Day of week -> percentage
  withdrawalDays: { [key: string]: number }; // Day of week -> percentage
  dailyAverageDeposit: number;
  dailyAverageWithdrawal: number;
  biggestDeposit: number;
  biggestWithdrawal: number;
  mostActiveDay: string;
  leastActiveDay: string;
}

// Day of week in Arabic
const daysOfWeek = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/**
 * تصنيف المحفظة بناءً على معايير معينة
 * @param wallet المحفظة المراد تصنيفها
 * @returns معلومات التصنيف
 */
export function classifyWallet(wallet: Wallet): WalletClassificationInfo {
  // حساب نسبة الحد المتبقي
  const remainingLimitPercentage = (wallet.remainingLimit / wallet.monthlyLimit) * 100;
  
  // محفظة مثالية للإرسال: محفظة برصيد مرتفع (>50,000) وحد متبقي مرتفع (>50%)
  if (wallet.balance > 50000 && remainingLimitPercentage > 50) {
    return {
      walletId: wallet.id,
      name: wallet.name,
      classification: WalletClassification.IdealForSending,
      reason: "رصيد مرتفع وحد متبقي كافٍ للتحويلات الكبيرة"
    };
  }
  
  // محفظة مثالية للاستقبال: محفظة برصيد منخفض (<10,000) وغير مهم الحد المتبقي
  if (wallet.balance < 10000) {
    return {
      walletId: wallet.id,
      name: wallet.name,
      classification: WalletClassification.IdealForReceiving,
      reason: "رصيد منخفض مناسب لاستقبال التحويلات"
    };
  }
  
  // محفظة تجاوزت الحد: رصيد مرتفع ولكن الحد المتبقي منخفض جدًا (<10%)
  if (wallet.balance > 20000 && remainingLimitPercentage < 10) {
    return {
      walletId: wallet.id,
      name: wallet.name,
      classification: WalletClassification.OverLimit,
      reason: "رصيد مرتفع ولكن الحد المتبقي منخفض جدًا"
    };
  }
  
  // محفظة غير مستغلة: رصيد منخفض وحد متبقي كامل تقريبًا
  if (wallet.balance < 20000 && remainingLimitPercentage > 90) {
    return {
      walletId: wallet.id,
      name: wallet.name,
      classification: WalletClassification.Unused,
      reason: "محفظة غير مستغلة بشكل كافٍ، الحد المتبقي مرتفع"
    };
  }
  
  // محفظة متوازنة: رصيد متوسط وحد متبقي كافٍ
  return {
    walletId: wallet.id,
    name: wallet.name,
    classification: WalletClassification.Balanced,
    reason: "رصيد وحد متبقي متوازنان"
  };
}

// Analyze wallets and provide recommendations
export function analyzeWallets(wallets: Wallet[]): WalletAnalysis {
  if (!wallets.length) {
    return {
      totalBalance: 0,
      totalLimit: 0,
      totalRemainingLimit: 0,
      walletDistribution: {},
      limitDistribution: {},
      limitWarnings: [],
      balanceImbalance: false,
      recommendations: ["أضف محفظة للبدء في استخدام التطبيق"],
      classifiedWallets: []
    };
  }

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const totalLimit = wallets.reduce((sum, wallet) => sum + wallet.monthlyLimit, 0);
  const totalRemainingLimit = wallets.reduce((sum, wallet) => sum + wallet.remainingLimit, 0);

  // Calculate wallet distribution
  const walletDistribution: { [key: string]: number } = {};
  wallets.forEach(wallet => {
    walletDistribution[wallet.id] = (wallet.balance / totalBalance) * 100;
  });

  // Calculate limit distribution
  const limitDistribution: { [key: string]: number } = {};
  wallets.forEach(wallet => {
    limitDistribution[wallet.id] = (wallet.remainingLimit / wallet.monthlyLimit) * 100;
  });

  // Find most and least used wallets
  const sortedWallets = [...wallets].sort((a, b) => 
    (a.remainingLimit / a.monthlyLimit) - (b.remainingLimit / b.monthlyLimit)
  );
  const mostUsedWallet = sortedWallets[0]?.id;
  const leastUsedWallet = sortedWallets[sortedWallets.length - 1]?.id;

  // Find wallets with low remaining limit
  const limitWarnings = wallets
    .map(wallet => {
      const remainingLimitPercentage = (wallet.remainingLimit / wallet.monthlyLimit) * 100;
      return {
        walletId: wallet.id,
        name: wallet.name,
        remainingLimitPercentage
      };
    })
    .filter(warning => warning.remainingLimitPercentage < 30);

  // Check for balance imbalance
  const maxDistribution = Math.max(...Object.values(walletDistribution));
  const balanceImbalance = maxDistribution > 50; // If one wallet has more than 50% of total balance

  // تصنيف المحافظ بناءً على المعايير المحددة
  const classifiedWallets: WalletClassificationInfo[] = wallets.map(wallet => classifyWallet(wallet));
  
  // Generate recommendations
  const recommendations: string[] = [];

  if (limitWarnings.length > 0) {
    limitWarnings.forEach(warning => {
      recommendations.push(
        `محفظة ${warning.name} تقترب من الحد الشهري (${Math.round(warning.remainingLimitPercentage)}٪ متبقي). ننصح باستخدام محفظة أخرى.`
      );
    });
  }

  if (balanceImbalance) {
    recommendations.push(
      "قم بتوزيع رصيدك بشكل أكثر توازناً بين المحافظ لتقليل المخاطر."
    );
  }

  if (wallets.length === 1) {
    recommendations.push(
      "أضف محفظة أخرى للاستفادة من نظام الدورات المتتالية وزيادة الحد الشهري المتاح."
    );
  }

  if (wallets.length >= 2) {
    // إضافة توصيات تتعلق بدورة المحافظ
    const idealForSending = classifiedWallets.filter(w => w.classification === WalletClassification.IdealForSending);
    const idealForReceiving = classifiedWallets.filter(w => w.classification === WalletClassification.IdealForReceiving);
    const overLimit = classifiedWallets.filter(w => w.classification === WalletClassification.OverLimit);
    
    if (idealForSending.length > 0 && idealForReceiving.length > 0) {
      recommendations.push(
        `استخدم محفظة ${idealForSending[0].name} للإرسال ومحفظة ${idealForReceiving[0].name} للاستقبال للتحكم الأمثل في الحدود الشهرية.`
      );
    }
    
    if (overLimit.length > 0) {
      recommendations.push(
        `تجنب استخدام محفظة ${overLimit[0].name} للإرسال لأنها تجاوزت الحد الشهري.`
      );
    }
  }

  return {
    totalBalance,
    totalLimit,
    totalRemainingLimit,
    walletDistribution,
    limitDistribution,
    mostUsedWallet,
    leastUsedWallet,
    limitWarnings,
    balanceImbalance,
    recommendations,
    classifiedWallets
  };
}

// Analyze transaction patterns
export function analyzeTransactionPatterns(transactions: Transaction[]): TransactionPattern {
  if (!transactions.length) {
    return {
      depositDays: {},
      withdrawalDays: {},
      dailyAverageDeposit: 0,
      dailyAverageWithdrawal: 0,
      biggestDeposit: 0,
      biggestWithdrawal: 0,
      mostActiveDay: "لا يوجد",
      leastActiveDay: "لا يوجد"
    };
  }

  // Count transactions by day of week
  const dayTransactions: { [key: string]: { deposits: number, withdrawals: number, count: number } } = {};
  daysOfWeek.forEach(day => {
    dayTransactions[day] = { deposits: 0, withdrawals: 0, count: 0 };
  });

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let depositCount = 0;
  let withdrawalCount = 0;
  let biggestDeposit = 0;
  let biggestWithdrawal = 0;

  transactions.forEach(transaction => {
    // Safely handle transaction date
    const dateStr = transaction.date || new Date().toISOString();
    const date = new Date(dateStr);
    const day = daysOfWeek[date.getDay()];
    
    dayTransactions[day].count++;
    
    if (transaction.type === 'deposit' || (transaction.type === 'transfer' && transaction.amount > 0)) {
      dayTransactions[day].deposits += transaction.amount;
      totalDeposits += transaction.amount;
      depositCount++;
      
      if (transaction.amount > biggestDeposit) {
        biggestDeposit = transaction.amount;
      }
    } else if (transaction.type === 'withdrawal' || (transaction.type === 'transfer' && transaction.amount < 0)) {
      const amount = Math.abs(transaction.amount);
      dayTransactions[day].withdrawals += amount;
      totalWithdrawals += amount;
      withdrawalCount++;
      
      if (amount > biggestWithdrawal) {
        biggestWithdrawal = amount;
      }
    }
  });

  // Calculate percentages for deposits by day
  const depositDays: { [key: string]: number } = {};
  daysOfWeek.forEach(day => {
    depositDays[day] = totalDeposits ? (dayTransactions[day].deposits / totalDeposits) * 100 : 0;
  });

  // Calculate percentages for withdrawals by day
  const withdrawalDays: { [key: string]: number } = {};
  daysOfWeek.forEach(day => {
    withdrawalDays[day] = totalWithdrawals ? (dayTransactions[day].withdrawals / totalWithdrawals) * 100 : 0;
  });

  // Determine most and least active days
  const sortedDays = Object.entries(dayTransactions)
    .sort((a, b) => b[1].count - a[1].count);
  
  const mostActiveDay = sortedDays[0]?.[0] || "لا يوجد";
  const leastActiveDay = sortedDays[sortedDays.length - 1]?.[0] || "لا يوجد";

  // Calculate daily averages
  const dailyAverageDeposit = depositCount ? totalDeposits / depositCount : 0;
  const dailyAverageWithdrawal = withdrawalCount ? totalWithdrawals / withdrawalCount : 0;

  return {
    depositDays,
    withdrawalDays,
    dailyAverageDeposit,
    dailyAverageWithdrawal,
    biggestDeposit,
    biggestWithdrawal,
    mostActiveDay,
    leastActiveDay
  };
}

// Generate a cyclic wallet strategy recommendation
export function generateCyclicStrategy(wallets: Wallet[]): {
  receiveWallet?: Wallet;
  sendWallet?: Wallet;
  recommendation: string;
  daysUntilLimitReached?: number;
} {
  if (wallets.length < 2) {
    return {
      recommendation: "أضف محفظتين على الأقل للاستفادة من نظام الدورات المتتالية."
    };
  }

  // Find best wallet for receiving (highest remaining limit)
  const sortedByRemainingLimit = [...wallets].sort((a, b) => b.remainingLimit - a.remainingLimit);
  const receiveWallet = sortedByRemainingLimit[0];

  // Find best wallet for sending (lowest remaining limit but still usable)
  const sortedByLowLimit = [...wallets]
    .filter(w => w.id !== receiveWallet.id && w.remainingLimit > 0)
    .sort((a, b) => a.remainingLimit - b.remainingLimit);
  
  const sendWallet = sortedByLowLimit[0];

  if (!sendWallet) {
    return {
      receiveWallet,
      recommendation: "استخدم محفظة أخرى للإرسال حيث أن المحافظ الأخرى قد استنفدت حدودها الشهرية."
    };
  }

  // Calculate approximate days until limit is reached (based on 30-day month)
  const remainingLimitPercentage = (sendWallet.remainingLimit / sendWallet.monthlyLimit) * 100;
  const daysUntilLimitReached = Math.ceil((remainingLimitPercentage / 100) * 30);

  let recommendation = "";
  
  if (remainingLimitPercentage < 20) {
    recommendation = `ننصح بتبديل دور المحافظ قريباً. يتبقى ${sendWallet.remainingLimit} جنيه فقط في الحد الشهري لمحفظة الإرسال (${Math.round(remainingLimitPercentage)}٪).`;
  } else if (remainingLimitPercentage < 50) {
    recommendation = `يمكنك الاستمرار باستخدام محفظة ${sendWallet.name} للإرسال لفترة أطول، لكن ضع في اعتبارك أن الحد المتبقي منخفض نسبياً (${Math.round(remainingLimitPercentage)}٪).`;
  } else {
    recommendation = `استراتيجية الدورات الحالية مثالية. استمر في استخدام محفظة ${receiveWallet.name} للاستقبال ومحفظة ${sendWallet.name} للإرسال.`;
  }

  return {
    receiveWallet,
    sendWallet,
    recommendation,
    daysUntilLimitReached
  };
}

// Generate prediction for when a wallet's limit will be exhausted
export function predictLimitExhaustion(wallet: Wallet, transactions: Transaction[]): {
  willExhaustLimit: boolean;
  daysUntilExhausted?: number;
  recommendedAction?: string;
} {
  if (wallet.remainingLimit >= wallet.monthlyLimit * 0.9) {
    return {
      willExhaustLimit: false,
      recommendedAction: "الحد المتبقي مرتفع جداً. استمر في استخدام هذه المحفظة."
    };
  }

  // Find transactions related to this wallet
  const walletTransactions = transactions.filter(t => t.walletId === wallet.id);
  
  if (walletTransactions.length < 3) {
    return {
      willExhaustLimit: true,
      recommendedAction: "لا توجد معاملات كافية للتنبؤ بدقة. راقب الحد المتبقي."
    };
  }

  // Calculate average daily spending (last 7 days)
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  const recentTransactions = walletTransactions.filter(t => {
    const dateStr = t.date || new Date().toISOString();
    const transactionDate = new Date(dateStr);
    return transactionDate >= oneWeekAgo;
  });

  let totalSpent = 0;
  recentTransactions.forEach(t => {
    if (t.type === 'withdrawal' || t.type === 'transfer') {
      totalSpent += Math.abs(t.amount);
    }
  });

  const daysCount = Math.min(7, recentTransactions.length);
  const dailyAverage = daysCount > 0 ? totalSpent / daysCount : 0;

  if (dailyAverage === 0) {
    return {
      willExhaustLimit: false,
      recommendedAction: "لم يتم تسجيل أي سحوبات مؤخراً. لا يمكن التنبؤ بدقة."
    };
  }

  // Calculate days until limit exhaustion
  const daysUntilExhausted = Math.floor(wallet.remainingLimit / dailyAverage);

  let recommendedAction = "";
  if (daysUntilExhausted <= 3) {
    recommendedAction = "ننصح بتغيير محفظة الإرسال فوراً لتجنب الوصول للحد.";
  } else if (daysUntilExhausted <= 7) {
    recommendedAction = "ننصح بالتخطيط لتغيير محفظة الإرسال خلال الأسبوع القادم.";
  } else {
    recommendedAction = `يمكنك الاستمرار في استخدام هذه المحفظة لمدة تقريبية ${daysUntilExhausted} يوم.`;
  }

  return {
    willExhaustLimit: true,
    daysUntilExhausted,
    recommendedAction
  };
}
