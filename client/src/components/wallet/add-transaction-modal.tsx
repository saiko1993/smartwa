import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/zustand-store";
import { transactionTypes } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
}

const transactionFormSchema = z.object({
  type: z.enum(["deposit", "withdrawal", "transfer"], {
    required_error: "نوع المعاملة مطلوب",
  }),
  amount: z.coerce.number()
    .positive({ message: "المبلغ يجب أن يكون رقم موجب" })
    .min(0.01, { message: "المبلغ يجب أن يكون أكبر من صفر" }),
  description: z.string().min(1, { message: "الوصف مطلوب" }),
  date: z.string().optional(),
  reference: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function AddTransactionModal({ isOpen, onClose, walletId }: AddTransactionModalProps) {
  const { addTransaction } = useStore();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "deposit",
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
      reference: "",
    }
  });
  
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        type: "deposit",
        amount: 0,
        description: "",
        date: new Date().toISOString().split("T")[0],
        reference: "",
      });
    }
  }, [isOpen, form]);
  
  const onSubmit = async (data: TransactionFormValues) => {
    try {
      // For withdrawal and transfer, make the amount negative
      const amount = data.type === "withdrawal" || data.type === "transfer" 
        ? -Math.abs(data.amount) 
        : data.amount;
      
      await addTransaction({
        walletId,
        type: data.type,
        amount: data.type === "withdrawal" || data.type === "transfer" ? -Math.abs(data.amount) : data.amount,
        description: data.description,
        date: data.date,
        reference: data.reference,
      });
      
      onClose();
    } catch (error) {
      console.error("Failed to add transaction:", error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة معاملة جديدة</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>نوع المعاملة</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-2"
                    >
                      {transactionTypes.map((type) => (
                        <div key={type.value} className="relative">
                          <RadioGroupItem
                            value={type.value}
                            id={type.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={type.value}
                            className="flex items-center justify-center p-2 border border-gray-300 rounded-md text-sm cursor-pointer transition-all peer-data-[state=checked]:bg-primary-50 peer-data-[state=checked]:border-primary-500 peer-data-[state=checked]:text-primary-700 hover:bg-gray-50"
                          >
                            {type.value === "deposit" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                              </svg>
                            )}
                            {type.value === "withdrawal" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <polyline points="19 12 12 19 5 12" />
                              </svg>
                            )}
                            {type.value === "transfer" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 10l5 5-5 5" />
                                <path d="M20 15h-7a4 4 0 0 1-4-4V5" />
                                <path d="M8 9l-5-5 5-5" />
                                <path d="M4 4h7a4 4 0 0 1 4 4v7" />
                              </svg>
                            )}
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المبلغ</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: راتب شهر يونيو" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التاريخ</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم مرجعي (اختياري)</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: TRX123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p>سيتم تحديث الرصيد والحد المتبقي تلقائياً بعد إضافة المعاملة.</p>
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-primary-600 hover:bg-primary-700" disabled={form.formState.isSubmitting}>
                إضافة المعاملة
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
