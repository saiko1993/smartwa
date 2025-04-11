import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wallet } from "@shared/schema";
import { useStore } from "@/lib/zustand-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletToEdit?: Wallet;
}

// تحويل الأرقام العربية إلى الإنجليزية
function convertArabicToEnglishNumbers(input: string): string {
  const arabicToEnglishMap: { [key: string]: string } = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  return input.replace(/[٠-٩]/g, match => arabicToEnglishMap[match] || match);
}

// Form schema for wallet
const walletFormSchema = z.object({
  name: z.string().min(1, { message: "اسم الهاتف مطلوب" }),
  simNumber: z.string().default("1"),
  phoneNumber: z.string()
    .min(11, { message: "رقم الهاتف يجب أن يكون 11 رقم" })
    .max(11, { message: "رقم الهاتف يجب أن يكون 11 رقم" })
    .refine((val) => {
      // تحويل الأرقام العربية إلى الإنجليزية
      const englishNumbers = convertArabicToEnglishNumbers(val);
      return englishNumbers.startsWith("010") || englishNumbers.startsWith("011") || 
             englishNumbers.startsWith("012") || englishNumbers.startsWith("015");
    }, {
      message: "رقم الهاتف يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015"
    })
    .transform(convertArabicToEnglishNumbers),
  pinCode: z.string().optional(),
  balance: z.coerce.number().min(0, { message: "الرصيد يجب أن يكون رقم موجب" }),
  monthlyLimit: z.coerce.number().min(0, { message: "الحد الشهري يجب أن يكون رقم موجب" }),
});

type WalletFormValues = z.infer<typeof walletFormSchema>;

export function AddWalletModal({ isOpen, onClose, walletToEdit }: AddWalletModalProps) {
  const { addWallet, updateWallet } = useStore();
  const [showPinCode, setShowPinCode] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const isEditing = !!walletToEdit;
  
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      name: walletToEdit?.name || "",
      simNumber: walletToEdit?.simNumber || "1",
      phoneNumber: walletToEdit?.phoneNumber || "",
      pinCode: walletToEdit?.pinCode || "",
      balance: walletToEdit?.balance || 0,
      monthlyLimit: walletToEdit?.monthlyLimit || 200000,
    }
  });
  
  React.useEffect(() => {
    if (isOpen && walletToEdit) {
      form.reset({
        name: walletToEdit.name,
        simNumber: walletToEdit.simNumber || "1",
        phoneNumber: walletToEdit.phoneNumber,
        pinCode: walletToEdit.pinCode || "",
        balance: walletToEdit.balance,
        monthlyLimit: walletToEdit.monthlyLimit,
      });
    } else if (isOpen) {
      form.reset({
        name: "",
        simNumber: "1",
        phoneNumber: "",
        pinCode: "",
        balance: 0,
        monthlyLimit: 200000,
      });
    }
  }, [isOpen, walletToEdit, form]);
  
  // نسخ رقم الهاتف
  const copyPhoneNumber = () => {
    const phoneNumber = form.getValues("phoneNumber");
    if (phoneNumber) {
      navigator.clipboard.writeText(phoneNumber).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };
  
  const onSubmit = async (data: WalletFormValues) => {
    try {
      // تحويل الأرقام العربية في رقم الهاتف إلى إنجليزية (تم تنفيذه تلقائياً في المخطط)
      // إضافة نوع المحفظة تلقائيًا (فودافون كاش)
      const walletData = {
        ...data,
        type: "vodafone-cash"
      };
      
      if (isEditing && walletToEdit) {
        // عند التعديل، نحتفظ بالحد المتبقي أو نحسبه بناءً على تغيير الحد الشهري في وظيفة updateWallet
        // لذا لسنا بحاجة لإعادة حسابه هنا، الوظيفة updateWallet ستتعامل مع ذلك
        await updateWallet({
          ...walletToEdit,
          ...walletData,
        });
      } else {
        // لمحافظ جديدة، نضبط الحد المتبقي مساويًا للحد الشهري
        await addWallet({
          ...walletData,
          remainingLimit: data.monthlyLimit,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save wallet:", error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "تعديل المحفظة" : "إضافة محفظة فودافون كاش جديدة"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الهاتف</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: هاتف العمل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="simNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الشريحة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الشريحة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">الشريحة 1</SelectItem>
                      <SelectItem value="2">الشريحة 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input placeholder="01xxxxxxxxx" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={copyPhoneNumber}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">سيتم تحويل الأرقام العربية تلقائياً إلى الإنجليزية.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pinCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الرقم السري للمحفظة</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input 
                        type={showPinCode ? "text" : "password"} 
                        placeholder="الرقم السري (اختياري)" 
                        {...field} 
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={() => setShowPinCode(!showPinCode)}
                    >
                      {showPinCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">الرقم السري الخاص بحسابك في فودافون كاش.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الرصيد الحالي</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        className="rounded-l-none"
                      />
                    </FormControl>
                    <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 border border-r-0 border-gray-300 rounded-l-md">
                      جنيه
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">الرصيد الحالي للمحفظة.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="monthlyLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الحد الشهري</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="200000"
                        {...field}
                        className="rounded-l-none"
                      />
                    </FormControl>
                    <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 border border-r-0 border-gray-300 rounded-l-md">
                      جنيه
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">الحد الافتراضي هو ٢٠٠,٠٠٠ جنيه ويتم تجديده تلقائيًا أول كل شهر.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting}>
                {isEditing ? "تحديث المحفظة" : "إضافة المحفظة"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
