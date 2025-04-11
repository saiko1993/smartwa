import { getDB, generateId } from './db';
import { Wallet, Transaction, Notification, walletSchema } from '@shared/schema';
import { getCurrentDate } from './utils';

// Wallets CRUD operations
export async function getAllWallets(): Promise<Wallet[]> {
  const db = await getDB();
  return db.getAll('wallets');
}

export async function getWalletById(id: string): Promise<Wallet | undefined> {
  const db = await getDB();
  return db.get('wallets', id);
}

export async function addWallet(wallet: Omit<Wallet, 'id' | 'lastUpdated'>): Promise<Wallet> {
  const db = await getDB();
  const newWallet: Wallet = {
    ...wallet,
    id: generateId(),
    lastUpdated: getCurrentDate(),
  };
  
  // Validate the wallet data
  walletSchema.parse(newWallet);
  
  await db.add('wallets', newWallet);
  return newWallet;
}

export async function updateWallet(wallet: Wallet): Promise<Wallet> {
  const db = await getDB();
  
  // Ensure the wallet has an ID
  if (!wallet.id) {
    throw new Error("Wallet ID is required for update");
  }
  
  // الحصول على المحفظة الحالية للمقارنة
  const currentWallet = await db.get('wallets', wallet.id);
  
  if (!currentWallet) {
    throw new Error("Wallet not found");
  }
  
  // حساب نسبة الحد المتبقي من الحد الشهري القديم
  const remainingLimitPercentage = currentWallet.remainingLimit / currentWallet.monthlyLimit;
  
  // التحقق مما إذا تم تغيير الحد الشهري
  const isMonthlyLimitChanged = currentWallet.monthlyLimit !== wallet.monthlyLimit;
  
  // تحديث الحد المتبقي إذا تم تغيير الحد الشهري
  let newRemainingLimit = wallet.remainingLimit;
  
  if (isMonthlyLimitChanged) {
    // إذا تم زيادة الحد الشهري، نزيد الحد المتبقي بنفس النسبة
    // إذا تم تقليل الحد الشهري، نقلل الحد المتبقي بنفس النسبة
    // لكن نضمن ألا يتجاوز الحد المتبقي الحد الشهري الجديد
    newRemainingLimit = Math.min(
      wallet.monthlyLimit,
      Math.max(0, Math.round(wallet.monthlyLimit * remainingLimitPercentage))
    );
  }
  
  // Update lastUpdated
  const updatedWallet: Wallet = {
    ...wallet,
    remainingLimit: newRemainingLimit,
    lastUpdated: getCurrentDate(),
  };
  
  // Validate the wallet data
  walletSchema.parse(updatedWallet);
  
  await db.put('wallets', updatedWallet);
  return updatedWallet;
}

export async function deleteWallet(id: string): Promise<void> {
  const db = await getDB();
  
  // First, delete all transactions belonging to this wallet
  try {
    const transactions = await db.getAllFromIndex('transactions', 'by-wallet', id);
    for (const transaction of transactions) {
      if (transaction && transaction.id) {
        await db.delete('transactions', transaction.id);
      }
    }
  } catch (error) {
    console.error('Error deleting wallet transactions:', error);
  }
  
  // Then delete the wallet
  await db.delete('wallets', id);
}

export async function updateWalletBalance(id: string, newBalance: number, difference?: number): Promise<Wallet> {
  const db = await getDB();
  const wallet = await db.get('wallets', id);
  
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  
  // إذا كان الفرق في الرصيد سالب (أي نقص الرصيد)، فيتم خصم القيمة من الحد المتبقي
  let newRemainingLimit = wallet.remainingLimit;
  
  if (difference !== undefined && difference < 0) {
    // خصم القيمة المطلقة للفرق من الحد المتبقي
    newRemainingLimit = Math.max(0, wallet.remainingLimit + difference);
  }
  
  const updatedWallet: Wallet = {
    ...wallet,
    balance: newBalance,
    remainingLimit: newRemainingLimit,
    lastUpdated: getCurrentDate(),
  };
  
  await db.put('wallets', updatedWallet);
  return updatedWallet;
}

// Transactions CRUD operations
export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll('transactions');
}

export async function getTransactionsByWalletId(walletId: string): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAllFromIndex('transactions', 'by-wallet', walletId);
}

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction> {
  const db = await getDB();
  
  // Generate ID and set date
  const newTransaction: Transaction = {
    ...transaction,
    id: generateId(),
    date: getCurrentDate(),
  };
  
  // Add the transaction
  await db.add('transactions', newTransaction);
  
  // Update wallet balance and remaining limit
  const wallet = await db.get('wallets', transaction.walletId);
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  
  let newBalance = wallet.balance;
  let newRemainingLimit = wallet.remainingLimit;
  
  // Update balance based on transaction type
  if (transaction.type === 'deposit') {
    newBalance += transaction.amount;
  } else if (transaction.type === 'withdrawal' || transaction.type === 'transfer') {
    newBalance -= transaction.amount;
    newRemainingLimit -= transaction.amount;
  }
  
  // Update the wallet
  const updatedWallet: Wallet = {
    ...wallet,
    balance: newBalance,
    remainingLimit: newRemainingLimit,
    lastUpdated: getCurrentDate(),
  };
  
  await db.put('wallets', updatedWallet);
  
  return newTransaction;
}

export async function updateTransaction(transaction: Transaction): Promise<Transaction> {
  const db = await getDB();
  
  if (!transaction.id) {
    throw new Error("Transaction ID is required for update");
  }
  
  await db.put('transactions', transaction);
  return transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

// Notifications CRUD operations
export async function getAllNotifications(): Promise<Notification[]> {
  const db = await getDB();
  return db.getAll('notifications');
}

export async function addNotification(notification: Omit<Notification, 'id' | 'date' | 'isRead'>): Promise<Notification> {
  const db = await getDB();
  
  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    date: getCurrentDate(),
    isRead: false,
  };
  
  await db.add('notifications', newNotification);
  return newNotification;
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const db = await getDB();
  const notification = await db.get('notifications', id);
  
  if (!notification) {
    throw new Error("Notification not found");
  }
  
  const updatedNotification: Notification = {
    ...notification,
    isRead: true,
  };
  
  await db.put('notifications', updatedNotification);
  return updatedNotification;
}

export async function deleteNotification(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('notifications', id);
}

// Settings operations
export async function getSetting(key: string): Promise<any> {
  const db = await getDB();
  return db.get('settings', key);
}

export async function setSetting(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('settings', { id: key, value });
}

// Backup and restore
export async function exportAllData(): Promise<{
  wallets: Wallet[],
  transactions: Transaction[],
  notifications: Notification[],
  settings: Record<string, any>
}> {
  const db = await getDB();
  
  const wallets = await db.getAll('wallets');
  const transactions = await db.getAll('transactions');
  const notifications = await db.getAll('notifications');
  
  // Get all settings
  const settingsKeys = await db.getAllKeys('settings');
  const settings: Record<string, any> = {};
  
  for (const key of settingsKeys) {
    const setting = await db.get('settings', key);
    settings[key.toString()] = setting.value;
  }
  
  return {
    wallets,
    transactions,
    notifications,
    settings
  };
}

export async function importAllData(data: {
  wallets?: Wallet[],
  transactions?: Transaction[],
  notifications?: Notification[],
  settings?: Record<string, any>
}): Promise<void> {
  const db = await getDB();
  
  // Clear existing data if needed
  if (data.wallets) {
    await db.clear('wallets');
    for (const wallet of data.wallets) {
      await db.add('wallets', wallet);
    }
  }
  
  if (data.transactions) {
    await db.clear('transactions');
    for (const transaction of data.transactions) {
      await db.add('transactions', transaction);
    }
  }
  
  if (data.notifications) {
    await db.clear('notifications');
    for (const notification of data.notifications) {
      await db.add('notifications', notification);
    }
  }
  
  if (data.settings) {
    await db.clear('settings');
    for (const key in data.settings) {
      await db.put('settings', { id: key, value: data.settings[key] });
    }
  }
}

/**
 * إعادة ضبط الحد الشهري المتبقي لجميع المحافظ
 * يتم استدعاء هذه الوظيفة في بداية كل شهر
 * @returns عدد المحافظ التي تم إعادة ضبطها
 */
export async function resetMonthlyLimits(): Promise<number> {
  const db = await getDB();
  const wallets = await db.getAll('wallets');
  
  let updatedCount = 0;
  
  for (const wallet of wallets) {
    // نعيد ضبط الحد المتبقي ليساوي الحد الشهري
    const updatedWallet: Wallet = {
      ...wallet,
      remainingLimit: wallet.monthlyLimit,
      lastUpdated: getCurrentDate()
    };
    
    await db.put('wallets', updatedWallet);
    updatedCount++;
  }
  
  // إضافة إشعار بإعادة ضبط الحدود الشهرية
  if (updatedCount > 0) {
    await addNotification({
      title: "تم إعادة ضبط الحدود الشهرية",
      message: `تم إعادة ضبط الحد المتبقي لعدد ${updatedCount} محفظة بنجاح.`,
      type: "info"
    });
  }
  
  return updatedCount;
}

/**
 * التحقق مما إذا كان يجب إعادة ضبط الحدود الشهرية
 * يقارن التاريخ الحالي مع تاريخ آخر إعادة ضبط المخزن في الإعدادات
 * @returns true إذا كان يجب إعادة الضبط، false خلاف ذلك
 */
export async function shouldResetMonthlyLimits(): Promise<boolean> {
  const db = await getDB();
  
  // الحصول على تاريخ آخر إعادة ضبط
  const lastResetData = await db.get('settings', 'lastMonthlyLimitReset');
  const lastResetDate = lastResetData?.value ? new Date(lastResetData.value) : null;
  
  // إذا لم يتم إعادة الضبط من قبل، قم بإعادة الضبط
  if (!lastResetDate) {
    return true;
  }
  
  const currentDate = new Date();
  
  // نتحقق أولًا من أننا في اليوم الأول من الشهر
  const isFirstDayOfMonth = currentDate.getDate() === 1;
  
  // إذا لم نكن في اليوم الأول من الشهر، لا تقم بإعادة الضبط
  if (!isFirstDayOfMonth) {
    return false;
  }
  
  // إعادة الضبط إذا كنا في اليوم الأول من الشهر وفي شهر مختلف عن آخر إعادة ضبط
  return (
    currentDate.getMonth() !== lastResetDate.getMonth() ||
    currentDate.getFullYear() !== lastResetDate.getFullYear()
  );
}

/**
 * تحديث تاريخ آخر إعادة ضبط للحدود الشهرية
 */
export async function updateLastResetDate(): Promise<void> {
  const db = await getDB();
  await db.put('settings', { 
    id: 'lastMonthlyLimitReset', 
    value: new Date().toISOString() 
  });
}
