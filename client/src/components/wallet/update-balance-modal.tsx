import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wallet } from "@shared/schema";
import { useStore } from "@/lib/zustand-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Amount } from "@/components/ui/arabic-numbers";
import { formatNumberAr } from "@/lib/utils";

interface UpdateBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
}

// Form schema for wallet balance update
const balanceFormSchema = z.object({
  newBalance: z.coerce.number().min(0, { message: "الرصيد يجب أن يكون رقم موجب" }),
});

type BalanceFormValues = z.infer<typeof balanceFormSchema>;

export function UpdateBalanceModal({ isOpen, onClose, wallet }: UpdateBalanceModalProps) {
  const { updateWalletBalance } = useStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [balanceDifference, setBalanceDifference] = React.useState<number | null>(null);
  
  const form = useForm<BalanceFormValues>({
    resolver: zodResolver(balanceFormSchema),
    defaultValues: {
      newBalance: wallet?.balance || 0,
    }
  });
  
  React.useEffect(() => {
    if (isOpen && wallet) {
      form.reset({
        newBalance: wallet.balance,
      });
      setBalanceDifference(null);
    }
  }, [isOpen, wallet, form]);
  
  // حساب الفرق في الرصيد عند تغيير القيمة
  const calculateDifference = (newValue: number) => {
    const difference = newValue - wallet.balance;
    setBalanceDifference(difference);
  };
  
  const onSubmit = async (data: BalanceFormValues) => {
    try {
      setIsLoading(true);
      
      // حساب الفرق بين الرصيد الجديد والقديم
      const difference = data.newBalance - wallet.balance;
      
      // إذا كان الفرق سالب (نقص في الرصيد)، نقوم بخصم القيمة من الحد المتبقي
      // وإلا نبقي الحد المتبقي كما هو
      await updateWalletBalance(wallet.id, data.newBalance, difference);
      
      onClose();
    } catch (error) {
      console.error("Failed to update balance:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تحديث رصيد المحفظة</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            يمكنك تعديل الرصيد الحالي للمحفظة، وسيتم خصم أي نقص في الرصيد من الحد الشهري المتبقي تلقائيًا.
          </p>
        </DialogHeader>
        
        <div className="mt-2 mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">المحفظة:</span>
            <span className="font-medium">{wallet?.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">الرصيد الحالي:</span>
            <span className="font-medium">
              <Amount value={wallet?.balance || 0} />
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">الحد المتبقي:</span>
            <span className="font-medium">
              <Amount value={wallet?.remainingLimit || 0} />
            </span>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الرصيد الجديد</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          calculateDifference(Number(e.target.value));
                        }}
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
            
            {balanceDifference !== null && (
              <div className="py-2 px-3 rounded-md text-sm mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>التغيير في الرصيد:</span>
                  <span className={balanceDifference >= 0 ? "text-mahfazhati-success font-medium" : "text-mahfazhati-error font-medium"}>
                    {balanceDifference >= 0 ? "+" : ""}{formatNumberAr(balanceDifference)} جنيه
                  </span>
                </div>
                
                {balanceDifference < 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">سيتم خصم من الحد المتبقي:</span>
                    <span className="text-mahfazhati-error font-medium">
                      {formatNumberAr(Math.abs(balanceDifference))} جنيه
                    </span>
                  </div>
                )}
                
                {balanceDifference < 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">الحد المتبقي الجديد:</span>
                    <span className="font-medium">
                      {formatNumberAr(Math.max(0, wallet.remainingLimit + balanceDifference))} جنيه
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button 
                type="submit" 
                className="bg-primary-600 hover:bg-primary-700" 
                disabled={isLoading || form.formState.isSubmitting || balanceDifference === 0}
              >
                تحديث الرصيد
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}