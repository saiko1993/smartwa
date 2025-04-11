import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet } from '@shared/schema';
import { generateCyclicStrategy } from '@/lib/smart-planning';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Timer, 
  AlertCircle, 
  Check, 
  XCircle, 
  RotateCcw, 
  RotateCw,
  Gauge,
  Zap,
  Shield
} from 'lucide-react';
import { formatNumberAr, formatPercentage } from '@/lib/utils';
import { Amount } from '@/components/ui/arabic-numbers';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CyclicWalletStrategyProps {
  wallets: Wallet[];
}

export function CyclicWalletStrategy({ wallets }: CyclicWalletStrategyProps) {
  // التحقق من وجود المحافظ قبل إنشاء استراتيجية الدورات
  if (!wallets || wallets.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Timer className="w-5 h-5 ml-2 text-purple-500" />
            نظام الدورات المتتالية للمحافظ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 ml-2 flex-shrink-0" />
              <div>
                <p className="text-amber-800 dark:text-amber-300 font-medium">
                  أضف محفظتين على الأقل للاستفادة من نظام الدورات المتتالية.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const strategy = generateCyclicStrategy(wallets);
  
  if (!strategy.receiveWallet || !strategy.sendWallet) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Timer className="w-5 h-5 ml-2 text-purple-500" />
            نظام الدورات المتتالية للمحافظ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 ml-2 flex-shrink-0" />
              <div>
                <p className="text-amber-800 dark:text-amber-300 font-medium">
                  {strategy.recommendation}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // حساب نسبة الحد المتبقي للمحفظة المرسلة
  const sendWalletRemainingPercentage = strategy.sendWallet ? 
    Math.round((strategy.sendWallet.remainingLimit / strategy.sendWallet.monthlyLimit) * 100) : 0;
  
  // حساب نسبة امتلاء الدورة
  const cycleCompletionPercentage = strategy.receiveWallet ? 
    Math.min(100, Math.round((strategy.receiveWallet.balance / 100000) * 100)) : 0;
  
  // تحديد مرحلة الدورة
  const getCycleStage = () => {
    if (strategy.receiveWallet && strategy.receiveWallet.balance < 20000) return "بداية الدورة";
    if (strategy.receiveWallet && strategy.receiveWallet.balance >= 80000) return "نهاية الدورة";
    return "منتصف الدورة";
  };
  
  // تحديد لون شريط التقدم بناءً على النسبة المتبقية
  let progressColor = "bg-green-500";
  if (sendWalletRemainingPercentage < 20) {
    progressColor = "bg-red-500";
  } else if (sendWalletRemainingPercentage < 50) {
    progressColor = "bg-amber-500";
  }
  
  // تحديد ما إذا كانت نقطة التبديل المثالية
  const isOptimalSwitchPoint = 
    strategy.receiveWallet && strategy.sendWallet && 
    strategy.receiveWallet.balance >= 80000 && 
    strategy.receiveWallet.balance <= 100000 &&
    strategy.sendWallet.balance <= 20000;
  
  // تحديد نقطة التحذير
  const isWarningPoint = 
    strategy.receiveWallet && strategy.sendWallet &&
    strategy.sendWallet.balance < 20000 && 
    strategy.receiveWallet.balance < 80000;
  
  // التوصية بتغيير المحافظ
  const shouldChangeWallets = 
    sendWalletRemainingPercentage < 20 || 
    (strategy.receiveWallet && 
     (strategy.receiveWallet.remainingLimit / strategy.receiveWallet.monthlyLimit) < 0.2);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <RotateCw className="w-5 h-5 ml-2 text-purple-500" />
          نظام الدورات المتتالية للمحافظ
        </CardTitle>
        <CardDescription>
          إدارة النقود بالتناوب بين المحافظ لتحقيق أقصى استفادة من الحدود الشهرية
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* مؤشرات الحالة */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-100 dark:border-purple-900 flex items-center">
            <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-full ml-2">
              <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">مرحلة الدورة</div>
              <div className="font-medium text-sm">{getCycleStage()}</div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900 flex items-center">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full ml-2">
              <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">امتلاء الدورة</div>
              <div className="font-medium text-sm">{cycleCompletionPercentage}%</div>
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-100 dark:border-amber-900 flex items-center">
            <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full ml-2">
              <Timer className="w-4 h-4 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">أيام متبقية</div>
              <div className="font-medium text-sm">
                {strategy.daysUntilLimitReached || "غير محدد"}
              </div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="main" className="mb-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="main">الدورة الحالية</TabsTrigger>
            <TabsTrigger value="strategy">استراتيجيات التحسين</TabsTrigger>
            <TabsTrigger value="advanced">الخيارات المتقدمة</TabsTrigger>
          </TabsList>
          
          <TabsContent value="main">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* محفظة الاستقبال */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="bg-blue-500 text-white p-2 rounded-full ml-2">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold">محفظة الاستقبال</h3>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                    {((strategy.receiveWallet.remainingLimit / strategy.receiveWallet.monthlyLimit) * 100).toFixed(0)}% من الحد متاح
                  </Badge>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">الاسم</span>
                    <span className="font-medium">{strategy.receiveWallet.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">الرصيد الحالي</span>
                    <Amount value={strategy.receiveWallet.balance} className="font-medium" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">الحد المتبقي</span>
                    <span className="font-medium">{formatNumberAr(strategy.receiveWallet.remainingLimit)}</span>
                  </div>
                  
                  {/* امتلاء محفظة الاستقبال - مؤشر اكتمال الدورة */}
                  <div className="mt-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span>اكتمال الدورة</span>
                      <span>{cycleCompletionPercentage}%</span>
                    </div>
                    <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className={`absolute h-full ${cycleCompletionPercentage >= 80 ? 'bg-green-500' : 'bg-blue-500'} rounded-full`} 
                        style={{ width: `${cycleCompletionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* محفظة الإرسال */}
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-100 dark:border-green-900">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="bg-green-500 text-white p-2 rounded-full ml-2">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold">محفظة الإرسال</h3>
                  </div>
                  <Badge variant={sendWalletRemainingPercentage < 20 ? "destructive" : "outline"} className={sendWalletRemainingPercentage < 20 ? "" : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"}>
                    {sendWalletRemainingPercentage}% من الحد متاح
                  </Badge>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">الاسم</span>
                    <span className="font-medium">{strategy.sendWallet.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">الرصيد الحالي</span>
                    <Amount value={strategy.sendWallet.balance} className="font-medium" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">الحد المتبقي</span>
                    <span className="font-medium">{formatNumberAr(strategy.sendWallet.remainingLimit)}</span>
                  </div>
                  
                  <div className="mt-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span>الحد المتبقي</span>
                      <span>{sendWalletRemainingPercentage}%</span>
                    </div>
                    <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className={`absolute h-full ${progressColor} rounded-full`} 
                        style={{ width: `${sendWalletRemainingPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {strategy.daysUntilLimitReached && (
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3 ml-1" />
                      <span>
                        {strategy.daysUntilLimitReached <= 3 
                          ? `يوشك الحد على النفاد (تقريباً ${strategy.daysUntilLimitReached} أيام)`
                          : `متوقع استنفاد الحد خلال ${strategy.daysUntilLimitReached} يوم`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* توصيات استراتيجية الدورات */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 ml-2 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 dark:text-amber-300 font-medium">
                    {isOptimalSwitchPoint 
                      ? "نقطة التبديل المثالية: حان وقت تبديل المحافظ!" 
                      : isWarningPoint
                        ? "تحذير: محفظة الإرسال منخفضة ومحفظة الاستقبال لم تمتلئ بعد"
                        : strategy.recommendation
                    }
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-center text-sm text-amber-700 dark:text-amber-400">
                      <Check className="w-4 h-4 ml-1 text-green-500" />
                      <span>استقبل الأموال في محفظة {strategy.receiveWallet.name}</span>
                    </li>
                    <li className="flex items-center text-sm text-amber-700 dark:text-amber-400">
                      <Check className="w-4 h-4 ml-1 text-green-500" />
                      <span>أرسل الأموال من محفظة {strategy.sendWallet.name}</span>
                    </li>
                    {isOptimalSwitchPoint && (
                      <li className="flex items-center text-sm text-amber-700 dark:text-amber-400">
                        <Check className="w-4 h-4 ml-1 text-blue-500" />
                        <span>حان وقت تبديل الأدوار بين المحفظتين</span>
                      </li>
                    )}
                    {sendWalletRemainingPercentage < 30 && (
                      <li className="flex items-center text-sm text-amber-700 dark:text-amber-400">
                        <XCircle className="w-4 h-4 ml-1 text-red-500" />
                        <span>استعد لتبديل المحافظ قريباً نظراً لاقتراب نفاد الحد</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="strategy">
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-full bg-green-100 text-green-600">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold">استراتيجية التوازن المثالي</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  تعتمد على دورة مثالية بين محفظتين: واحدة للاستقبال (فارغة) وأخرى للإرسال (ممتلئة).
                </p>
                <ul className="text-sm space-y-1 mb-3 pr-4">
                  <li>محفظة استقبال برصيد صفر وحد متبقي كامل (200,000)</li>
                  <li>محفظة إرسال برصيد 100,000 وحد متبقي كامل (200,000)</li>
                  <li>إجمالي قدرة التداول: 100,000 (رصيد) + 400,000 (حدود) = 500,000</li>
                </ul>
                <Button size="sm" variant="outline" className="w-full">
                  تفعيل هذه الاستراتيجية
                </Button>
              </div>
              
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
                    <RotateCw className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold">استراتيجية التدفق السريع</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  استخدام 4 محافظ (دورتان متتاليتان) لزيادة التدفق النقدي الشهري.
                </p>
                <ul className="text-sm space-y-1 mb-3 pr-4">
                  <li>عند اقتراب الدورة الأولى من الاكتمال، تبدأ الدورة الثانية</li>
                  <li>يمكن التعامل مع مبالغ تصل إلى مليون جنيه شهرياً</li>
                </ul>
                <Button size="sm" variant="outline" className="w-full">
                  تفعيل هذه الاستراتيجية
                </Button>
              </div>
              
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-full bg-amber-100 text-amber-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold">استراتيجية الاحتياط</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  الاحتفاظ بمحفظة احتياطية للحالات الطارئة تستخدم فقط عند تعطل الدورة الرئيسية.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  تفعيل هذه الاستراتيجية
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-bold mb-3">نقاط اتخاذ القرار</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">نقطة التبديل المثالي</span>
                    <Badge className={isOptimalSwitchPoint ? "bg-green-100 text-green-800 border-green-200" : ""} variant={isOptimalSwitchPoint ? "default" : "outline"}>
                      {isOptimalSwitchPoint ? "وصلت" : "لم تصل بعد"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">نقطة التحذير</span>
                    <Badge variant={isWarningPoint ? "destructive" : "outline"}>
                      {isWarningPoint ? "تحذير نشط" : "طبيعي"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">نقطة تغيير المحافظ</span>
                    <Badge variant={shouldChangeWallets ? "destructive" : "outline"}>
                      {shouldChangeWallets ? "يجب التغيير" : "لا حاجة للتغيير"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border p-4">
                <h3 className="font-bold mb-3">توصيات تحسين الدورة</h3>
                <ul className="space-y-2 text-sm pr-4">
                  <li>إبقاء رصيد محفظة الاستقبال منخفضاً قدر الإمكان في بداية الدورة</li>
                  <li>تجنب استخدام محفظة الاستقبال للإرسال أو محفظة الإرسال للاستقبال</li>
                  <li>التبديل بين المحافظ عندما يصل رصيد محفظة الاستقبال إلى 80-100 ألف جنيه</li>
                  <li>مراقبة معدلات التدفق النقدي لتحسين توقيت التبديل</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}