// Note: We're using server-side API calls to OpenAI instead of direct client calls

/**
 * دالة عامة للوصول إلى خدمات الذكاء الاصطناعي
 * تعمل كطبقة وسيطة بين واجهة المستخدم وخدمات الخادم
 */
async function callAIService<T>(
  endpoint: string, 
  body: any
): Promise<T> {
  try {
    const response = await fetch(`/api/ai/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`خطأ في خدمة الذكاء الاصطناعي: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('فشل طلب الذكاء الاصطناعي:', error);
    throw error;
  }
}

/**
 * واجهة البيانات المستخدمة للتوصيات الذكية
 */
export interface AIRecommendation {
  type: 'usage' | 'transfer' | 'alert' | 'insight';
  title: string;
  description: string;
  actionText?: string;
  actionType?: 'positive' | 'negative' | 'neutral';
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
}

/**
 * واجهة نتائج تحليل أنماط المعاملات
 */
export interface TransactionPatternAnalysis {
  frequentDays: string[];
  peakTimeOfDay: string;
  unusualActivity: boolean;
  categoryBreakdown: Record<string, number>;
  averageTransactionSize: number;
  largeTransactions: number;
  topCounterparties: string[];
  seasonalPatterns: string[];
}

/**
 * واجهة توقعات استخدام الحد الشهري
 */
export interface LimitPrediction {
  daysUntilExhaustion: number;
  exhaustionDate: string;
  recommendation: string;
  expectedPatterns: {
    dailyUsage: number;
    weeklyUsage: number;
    peakDays: string[];
  }
}

/**
 * تصنيف المعاملات بناءً على وصفها
 * @param transactionDescription وصف المعاملة
 */
export async function classifyTransaction(transactionDescription: string): Promise<{
  category: string;
  confidence: number;
}> {
  try {
    return await callAIService<{ category: string; confidence: number }>(
      'classify-transaction', 
      { description: transactionDescription }
    );
  } catch (error) {
    console.error('خطأ في تصنيف المعاملة:', error);
    return { category: 'أخرى', confidence: 0 };
  }
}

/**
 * تحليل أنماط المعاملات باستخدام الذكاء الاصطناعي
 * @param transactions قائمة المعاملات للتحليل
 */
export async function analyzeTransactionPatterns(transactions: any[]): Promise<TransactionPatternAnalysis> {
  // في حالة عدم وجود معاملات كافية للتحليل، نعيد نتائج افتراضية
  if (transactions.length < 5) {
    return {
      frequentDays: ['غير متوفر'],
      peakTimeOfDay: 'غير متوفر',
      unusualActivity: false,
      categoryBreakdown: {},
      averageTransactionSize: 0,
      largeTransactions: 0,
      topCounterparties: [],
      seasonalPatterns: []
    };
  }

  try {
    // نقوم بتحضير بيانات المعاملات قبل إرسالها إلى الخادم
    const transactionData = transactions.map(t => ({
      date: t.date,
      amount: t.amount,
      type: t.type,
      description: t.description || '',
      walletId: t.walletId
    }));

    return await callAIService<TransactionPatternAnalysis>(
      'analyze-patterns',
      { transactions: transactionData }
    );
  } catch (error) {
    console.error('خطأ في تحليل أنماط المعاملات:', error);
    
    // عودة بنتائج تستند إلى الحسابات البسيطة في حالة فشل استدعاء الذكاء الاصطناعي
    const amounts = transactions.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    
    return {
      frequentDays: ['غير متوفر بسبب خطأ في التحليل'],
      peakTimeOfDay: 'غير متوفر',
      unusualActivity: false,
      categoryBreakdown: {},
      averageTransactionSize: avgAmount,
      largeTransactions: amounts.filter(a => a > avgAmount * 1.5).length,
      topCounterparties: [],
      seasonalPatterns: []
    };
  }
}

/**
 * توقع متى سيتم استنفاد الحد الشهري
 * @param wallet المحفظة المراد تحليلها
 * @param recentTransactions المعاملات الأخيرة
 */
export async function predictLimitExhaustion(wallet: any, recentTransactions: any[]): Promise<LimitPrediction> {
  // حساب أولي لمعدل الاستخدام اليومي - هذا فقط للحالات الاستثنائية
  let dailyUsage = 0;
  
  if (recentTransactions.length > 0) {
    const withdrawals = recentTransactions.filter(t => 
      t.type === 'withdrawal' || t.type === 'transfer').map(t => t.amount);
    
    if (withdrawals.length > 0) {
      const totalWithdrawal = withdrawals.reduce((a, b) => a + b, 0);
      dailyUsage = totalWithdrawal / 14;
    }
  }
  
  try {
    // إعداد البيانات المصغرة للمعاملات
    const transactionData = recentTransactions.map(t => ({
      date: t.date,
      amount: t.amount,
      type: t.type
    }));

    return await callAIService<LimitPrediction>(
      'predict-limit',
      { 
        wallet, 
        transactions: transactionData 
      }
    );
  } catch (error) {
    console.error('خطأ في التنبؤ بنفاد الحد الشهري:', error);
    
    // احسب عدد الأيام حتى نفاد الحد (إذا حدث خطأ مع API)
    const remainingLimit = wallet.remainingLimit;
    const daysUntilExhaustion = dailyUsage > 0 ? Math.floor(remainingLimit / dailyUsage) : 30;
    
    // احسب تاريخ النفاد المتوقع
    const today = new Date();
    const exhaustionDate = daysUntilExhaustion < 365 
      ? new Date(today.setDate(today.getDate() + daysUntilExhaustion)).toISOString()
      : "";
    
    // إرجاع تنبؤ بسيط بدون الذكاء الاصطناعي في حالة الخطأ
    return {
      daysUntilExhaustion,
      exhaustionDate,
      recommendation: 'ننصح بمراقبة الاستخدام اليومي للمحفظة',
      expectedPatterns: {
        dailyUsage,
        weeklyUsage: dailyUsage * 7,
        peakDays: ['غير متوفر']
      }
    };
  }
}

/**
 * إنشاء توصيات ذكية بناءً على بيانات المحافظ والمعاملات
 * @param wallets قائمة المحافظ
 * @param transactions قائمة المعاملات
 */
export async function generateSmartRecommendations(
  wallets: any[], 
  transactions: any[]
): Promise<AIRecommendation[]> {
  // إذا لم تكن هناك بيانات كافية، أعد قائمة فارغة
  if (wallets.length === 0) {
    return [];
  }

  try {
    // تجميع بيانات أولية عن المحافظ
    const walletsData = wallets.map(w => ({
      id: w.id,
      name: w.name,
      balance: w.balance,
      remainingLimit: w.remainingLimit,
      monthlyLimit: w.monthlyLimit,
      type: w.type
    }));

    // تجميع بيانات المعاملات الأخيرة لكل محفظة
    const walletTransactions: Record<string, any[]> = {};
    wallets.forEach(w => {
      walletTransactions[w.id] = transactions
        .filter(t => t.walletId === w.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); // آخر 10 معاملات لكل محفظة
    });

    // استدعاء خدمة الذكاء الاصطناعي
    const recommendations = await callAIService<AIRecommendation[]>(
      'smart-recommendations',
      { 
        wallets: walletsData, 
        transactions: walletTransactions 
      }
    );
    
    return recommendations;
  } catch (error) {
    console.error('خطأ في إنشاء التوصيات الذكية:', error);
    
    // إرجاع توصية افتراضية واحدة في حالة الخطأ
    return [{
      type: 'insight',
      title: 'راقب أنماط استخدامك',
      description: 'تتبع معدل استخدامك اليومي لمحافظك للمساعدة في تحسين إدارة الحدود الشهرية.',
      priority: 'medium',
      timestamp: new Date().toISOString()
    }];
  }
}

/**
 * الحصول على استجابة من المساعد الافتراضي الذكي
 * @param question سؤال المستخدم
 * @param wallets بيانات محافظ المستخدم
 * @param transactions بيانات معاملات المستخدم
 */
export async function getAIAssistantResponse(
  question: string, 
  wallets: any[], 
  transactions: any[]
): Promise<string> {
  if (!question || question.trim() === '') {
    return 'الرجاء إدخال سؤال حتى أتمكن من مساعدتك.';
  }

  try {
    // تجميع بيانات المحافظ
    const walletsData = wallets.map(w => ({
      id: w.id,
      name: w.name,
      balance: w.balance,
      remainingLimit: w.remainingLimit,
      monthlyLimit: w.monthlyLimit,
      type: w.type,
      lastUpdated: w.lastUpdated
    }));

    // آخر 20 معاملة
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    // استدعاء خدمة المساعد الافتراضي
    const response = await callAIService<{ response: string }>(
      'assistant',
      { 
        question, 
        wallets: walletsData, 
        transactions: recentTransactions 
      }
    );
    
    return response.response;
  } catch (error) {
    console.error('خطأ في الحصول على استجابة المساعد الافتراضي:', error);
    return 'عذراً، لم أتمكن من معالجة سؤالك في الوقت الحالي. يرجى المحاولة مرة أخرى لاحقاً.';
  }
}