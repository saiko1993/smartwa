import { pgTable, text, varchar, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Wallet schema
export const wallets = pgTable("wallets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(), // اسم الهاتف
  type: text("type").notNull(), // e.g. "vodafone-cash"
  simNumber: text("sim_number").notNull().default("1"), // الشريحة 1 أو 2
  phoneNumber: text("phone_number").notNull(), // رقم الهاتف
  pinCode: text("pin_code"), // الرقم السري للمحفظة
  balance: numeric("balance").notNull(), // الرصيد الحالي
  monthlyLimit: numeric("monthly_limit").notNull().default("200000"), // الحد الشهري الكامل
  remainingLimit: numeric("remaining_limit").notNull(), // الحد الشهري المتبقي
  lastUpdated: varchar("last_updated", { length: 255 }).notNull(),
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  walletId: varchar("wallet_id", { length: 36 }).notNull().references(() => wallets.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(), // positive for deposit, negative for withdrawal
  description: text("description").notNull(),
  date: varchar("date", { length: 255 }).notNull(),
  type: text("type").notNull(), // "deposit", "withdrawal", "transfer"
  reference: text("reference"),
});

// Notification schema
export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "success", "warning", "error", "info"
  title: text("title").notNull(),
  date: varchar("date", { length: 255 }).notNull(),
  isRead: boolean("is_read").notNull().default(false),
});

// Insert schemas
export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true, lastUpdated: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, date: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, date: true });

// Zod schemas for front-end validation
export const walletSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "اسم الهاتف مطلوب"), // اسم الهاتف
  type: z.string().min(1, "نوع المحفظة مطلوب"), // نوع المحفظة
  simNumber: z.string().min(1, "رقم الشريحة مطلوب").default("1"), // الشريحة 1 أو 2
  phoneNumber: z.string().min(11, "رقم الهاتف يجب أن يكون 11 رقم").max(11, "رقم الهاتف يجب أن يكون 11 رقم"), // رقم الهاتف
  pinCode: z.string().optional(), // الرقم السري (اختياري)
  balance: z.number().min(0, "الرصيد يجب أن يكون رقم موجب"), // الرصيد الحالي
  monthlyLimit: z.number().min(0, "الحد الشهري يجب أن يكون رقم موجب"), // الحد الشهري الكامل
  remainingLimit: z.number().min(0, "الحد المتبقي يجب أن يكون رقم موجب"), // الحد الشهري المتبقي
  lastUpdated: z.string(),
  transactions: z.array(z.object({
    id: z.string(),
    walletId: z.string(),
    amount: z.number(),
    description: z.string(),
    date: z.string(),
    type: z.enum(["deposit", "withdrawal", "transfer"]),
    reference: z.string().optional(),
  })).optional(),
});

export const transactionSchema = z.object({
  id: z.string().optional(),
  walletId: z.string().min(1, "معرف المحفظة مطلوب"),
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  description: z.string().min(1, "الوصف مطلوب"),
  date: z.string().optional(),
  type: z.enum(["deposit", "withdrawal", "transfer"], {
    errorMap: () => ({ message: "نوع المعاملة مطلوب" }),
  }),
  reference: z.string().optional(),
});

export const notificationSchema = z.object({
  id: z.string().optional(),
  message: z.string().min(1, "محتوى الإشعار مطلوب"),
  type: z.enum(["success", "warning", "error", "info"], {
    errorMap: () => ({ message: "نوع الإشعار مطلوب" }),
  }),
  title: z.string().min(1, "عنوان الإشعار مطلوب"),
  date: z.string().optional(),
  isRead: z.boolean().optional(),
});

// Types
export type Wallet = z.infer<typeof walletSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Notification = z.infer<typeof notificationSchema>;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type WalletWithTransactions = Wallet & { transactions: Transaction[] };

export const walletTypes = [
  { value: "vodafone-cash", label: "فودافون كاش" },
  { value: "etisalat-cash", label: "اتصالات كاش" },
  { value: "orange-cash", label: "اورانج كاش" },
  { value: "we-cash", label: "وي كاش" },
];

export const transactionTypes = [
  { value: "deposit", label: "إيداع" },
  { value: "withdrawal", label: "سحب" },
  { value: "transfer", label: "تحويل" },
];
