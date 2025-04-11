import { wallets, transactions, notifications, type Wallet, type Transaction, type Notification, type InsertWallet, type InsertTransaction, type InsertNotification } from "../shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { generateId } from "../shared/utils";

// Utility functions to convert between database and application types
function convertDBWalletToApp(dbWallet: any): Wallet {
  return {
    ...dbWallet,
    balance: parseFloat(dbWallet.balance),
    monthlyLimit: parseFloat(dbWallet.monthlyLimit),
    remainingLimit: parseFloat(dbWallet.remainingLimit),
  };
}

function convertAppWalletToDB(wallet: Omit<Wallet, "id"> | Partial<Omit<Wallet, "id">>): any {
  return {
    ...wallet,
    balance: wallet.balance?.toString(),
    monthlyLimit: wallet.monthlyLimit?.toString(),
    remainingLimit: wallet.remainingLimit?.toString(),
  };
}

function convertDBTransactionToApp(dbTransaction: any): Transaction {
  return {
    ...dbTransaction,
    type: dbTransaction.type as "deposit" | "withdrawal" | "transfer",
    amount: parseFloat(dbTransaction.amount),
    reference: dbTransaction.reference || undefined,
  };
}

function convertAppTransactionToDB(transaction: Omit<Transaction, "id">): any {
  return {
    ...transaction,
    amount: transaction.amount.toString(),
  };
}

function convertDBNotificationToApp(dbNotification: any): Notification {
  return {
    ...dbNotification,
    type: dbNotification.type as "success" | "warning" | "error" | "info",
  };
}

function convertAppNotificationToDB(notification: Omit<Notification, "id">): any {
  return {
    ...notification,
  };
}

export interface IStorage {
  // Wallet operations
  getWallets(): Promise<Wallet[]>;
  getWallet(id: string): Promise<Wallet | undefined>;
  saveWallet(wallet: Omit<Wallet, "id">): Promise<Wallet>;
  updateWallet(id: string, updates: Partial<Omit<Wallet, "id">>): Promise<Wallet | undefined>;
  deleteWallet(id: string): Promise<boolean>;
  
  // Transaction operations
  getTransactions(walletId?: string): Promise<Transaction[]>;
  saveTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Notification operations
  getNotifications(): Promise<Notification[]>;
  saveNotification(notification: Omit<Notification, "id">): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Wallet operations
  async getWallets(): Promise<Wallet[]> {
    const dbWallets = await db.select().from(wallets);
    return dbWallets.map(convertDBWalletToApp);
  }
  
  async getWallet(id: string): Promise<Wallet | undefined> {
    const result = await db.select().from(wallets).where(eq(wallets.id, id));
    return result.length > 0 ? convertDBWalletToApp(result[0]) : undefined;
  }
  
  async saveWallet(walletData: Omit<Wallet, "id">): Promise<Wallet> {
    const id = generateId();
    const wallet = { ...walletData, id };
    const dbWallet = convertAppWalletToDB(wallet);
    
    const [insertedWallet] = await db.insert(wallets)
      .values(dbWallet)
      .returning();
    
    return convertDBWalletToApp(insertedWallet);
  }
  
  async updateWallet(id: string, updates: Partial<Omit<Wallet, "id">>): Promise<Wallet | undefined> {
    const dbUpdates = convertAppWalletToDB(updates);
    
    const [updatedWallet] = await db.update(wallets)
      .set(dbUpdates)
      .where(eq(wallets.id, id))
      .returning();
    
    return updatedWallet ? convertDBWalletToApp(updatedWallet) : undefined;
  }
  
  async deleteWallet(id: string): Promise<boolean> {
    const result = await db.delete(wallets)
      .where(eq(wallets.id, id))
      .returning({ id: wallets.id });
    
    return result.length > 0;
  }
  
  // Transaction operations
  async getTransactions(walletId?: string): Promise<Transaction[]> {
    let dbTransactions;
    if (walletId) {
      dbTransactions = await db.select()
        .from(transactions)
        .where(eq(transactions.walletId, walletId));
    } else {
      dbTransactions = await db.select().from(transactions);
    }
    return dbTransactions.map(convertDBTransactionToApp);
  }
  
  async saveTransaction(transactionData: Omit<Transaction, "id">): Promise<Transaction> {
    const id = generateId();
    const transaction = { ...transactionData, id };
    const dbTransaction = convertAppTransactionToDB(transaction);
    
    const [insertedTransaction] = await db.insert(transactions)
      .values(dbTransaction)
      .returning();
    
    return convertDBTransactionToApp(insertedTransaction);
  }
  
  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions)
      .where(eq(transactions.id, id))
      .returning({ id: transactions.id });
    
    return result.length > 0;
  }
  
  // Notification operations
  async getNotifications(): Promise<Notification[]> {
    const dbNotifications = await db.select().from(notifications);
    return dbNotifications.map(convertDBNotificationToApp);
  }
  
  async saveNotification(notificationData: Omit<Notification, "id">): Promise<Notification> {
    const id = generateId();
    const notification = { ...notificationData, id };
    const dbNotification = convertAppNotificationToDB(notification);
    
    const [insertedNotification] = await db.insert(notifications)
      .values(dbNotification)
      .returning();
    
    return convertDBNotificationToApp(insertedNotification);
  }
  
  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning({ id: notifications.id });
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
