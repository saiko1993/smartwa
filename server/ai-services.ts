import OpenAI from "openai";
import { Request, Response } from "express";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * تصنيف المعاملات بناءً على وصفها
 */
export async function classifyTransactionHandler(req: Request, res: Response) {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'وصف المعاملة مطلوب' });
    }

    const prompt = `
    صنف المعاملة المالية التالية إلى فئة مناسبة (مشتريات، فواتير، تحويلات شخصية، إيداع، سحب، أخرى).
    أعط تقييماً للثقة من 0 إلى 1.
    المعاملة: "${description || ''}"

    استجب بتنسيق JSON فقط كالتالي:
    { "category": "اسم الفئة", "confidence": 0.95 }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    return res.json(JSON.parse(content));
  } catch (error) {
    console.error('خطأ في تصنيف المعاملة:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ أثناء تصنيف المعاملة',
      category: 'أخرى', 
      confidence: 0 
    });
  }
}

/**
 * تحليل أنماط المعاملات
 */
export async function analyzeTransactionPatternsHandler(req: Request, res: Response) {
  try {
    const { transactions } = req.body;
    
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'مصفوفة المعاملات مطلوبة' });
    }

    // في حالة عدم وجود معاملات كافية للتحليل، نعيد نتائج افتراضية
    if (transactions.length < 5) {
      return res.json({
        frequentDays: ['غير متوفر'],
        peakTimeOfDay: 'غير متوفر',
        unusualActivity: false,
        categoryBreakdown: {},
        averageTransactionSize: 0,
        largeTransactions: 0,
        topCounterparties: [],
        seasonalPatterns: []
      });
    }

    // تجهيز البيانات للتحليل
    const transactionData = transactions.map(t => ({
      date: t.date,
      amount: t.amount,
      type: t.type,
      description: t.description || '',
      walletId: t.walletId
    }));

    const prompt = `
    حلل بيانات المعاملات التالية وقدم نظرة عامة عن أنماط الإنفاق والسحب.
    أريد معرفة: أيام الأسبوع الأكثر نشاطاً، وقت الذروة خلال اليوم، النشاط غير العادي، 
    تقسيم الفئات، متوسط حجم المعاملات، عدد المعاملات الكبيرة، والأطراف المقابلة الأكثر تعاملاً.

    بيانات المعاملات:
    ${JSON.stringify(transactionData)}

    استجب بتنسيق JSON فقط:
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);

    return res.json({
      ...result,
      // نضيف بعض المعالجة الإضافية هنا إذا لزم الأمر
      averageTransactionSize: transactions.reduce((acc, t) => acc + t.amount, 0) / transactions.length
    });
  } catch (error) {
    console.error('خطأ في تحليل أنماط المعاملات:', error);
    
    // عودة بنتائج تستند إلى الحسابات البسيطة في حالة فشل استدعاء الذكاء الاصطناعي
    const amounts = req.body.transactions.map((t: any) => t.amount);
    const avgAmount = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
    
    return res.status(500).json({
      error: 'حدث خطأ أثناء تحليل المعاملات',
      frequentDays: ['غير متوفر بسبب خطأ في التحليل'],
      peakTimeOfDay: 'غير متوفر',
      unusualActivity: false,
      categoryBreakdown: {},
      averageTransactionSize: avgAmount,
      largeTransactions: amounts.filter((a: number) => a > avgAmount * 1.5).length,
      topCounterparties: [],
      seasonalPatterns: []
    });
  }
}

/**
 * توقع متى سيتم استنفاد الحد الشهري
 */
export async function predictLimitExhaustionHandler(req: Request, res: Response) {
  try {
    const { wallet, transactions } = req.body;
    
    if (!wallet) {
      return res.status(400).json({ error: 'بيانات المحفظة مطلوبة' });
    }

    // حساب أولي لمعدل الاستخدام اليومي
    let dailyUsage = 0;
    
    if (transactions && transactions.length > 0) {
      // حساب معدل الاستخدام من المعاملات السابقة
      const withdrawals = transactions
        .filter((t: any) => t.type === 'withdrawal' || t.type === 'transfer')
        .map((t: any) => t.amount);
      
      if (withdrawals.length > 0) {
        const totalWithdrawal = withdrawals.reduce((a: number, b: number) => a + b, 0);
        // افترض أن المعاملات من الأسبوعين الماضيين
        dailyUsage = totalWithdrawal / 14;
      }
    }
    
    // احسب عدد الأيام حتى نفاد الحد
    const remainingLimit = wallet.remainingLimit;
    const daysUntilExhaustion = dailyUsage > 0 ? Math.floor(remainingLimit / dailyUsage) : 30;
    
    // احسب تاريخ النفاد المتوقع
    const today = new Date();
    const exhaustionDate = daysUntilExhaustion < 365 
      ? new Date(today.setDate(today.getDate() + daysUntilExhaustion)).toISOString()
      : "";

    const walletData = {
      balance: wallet.balance,
      monthlyLimit: wallet.monthlyLimit,
      remainingLimit: wallet.remainingLimit,
      dailyUsageRate: dailyUsage,
      daysUntilExhaustion
    };

    const prompt = `
    قدم تحليلاً لتوقع استنفاد الحد الشهري لمحفظة فودافون كاش بناءً على البيانات التالية:
    ${JSON.stringify(walletData)}

    وقدم توصية مناسبة عن كيفية إدارة هذه المحفظة.
    استجب بتنسيق JSON فقط يتضمن:
    1. عدد الأيام المتبقية حتى نفاد الحد
    2. توصية حول ما يجب فعله
    3. الأنماط المتوقعة للاستخدام
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    const aiResult = JSON.parse(content);
    
    return res.json({
      daysUntilExhaustion,
      exhaustionDate,
      recommendation: aiResult.recommendation || 'لا توجد توصيات متاحة',
      expectedPatterns: aiResult.expectedPatterns || {
        dailyUsage,
        weeklyUsage: dailyUsage * 7,
        peakDays: ['غير متوفر']
      }
    });
  } catch (error) {
    console.error('خطأ في التنبؤ بنفاد الحد الشهري:', error);
    
    const { wallet } = req.body;
    const dailyUsage = 0;
    const daysUntilExhaustion = 30;
    const exhaustionDate = "";
    
    // إرجاع تنبؤ بسيط بدون الذكاء الاصطناعي في حالة الخطأ
    return res.status(500).json({
      error: 'حدث خطأ أثناء التنبؤ بنفاد الحد الشهري',
      daysUntilExhaustion,
      exhaustionDate,
      recommendation: 'ننصح بمراقبة الاستخدام اليومي للمحفظة',
      expectedPatterns: {
        dailyUsage,
        weeklyUsage: dailyUsage * 7,
        peakDays: ['غير متوفر']
      }
    });
  }
}

/**
 * إنشاء توصيات ذكية بناءً على بيانات المحافظ والمعاملات
 */
export async function generateSmartRecommendationsHandler(req: Request, res: Response) {
  try {
    const { wallets, transactions } = req.body;
    
    // إذا لم تكن هناك بيانات كافية، أعد قائمة فارغة
    if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
      return res.status(400).json({ error: 'مصفوفة المحافظ مطلوبة' });
    }

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
    if (transactions && Array.isArray(transactions)) {
      wallets.forEach(w => {
        walletTransactions[w.id] = transactions
          .filter(t => t.walletId === w.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10); // آخر 10 معاملات لكل محفظة
      });
    }

    const prompt = `
    قم بتحليل بيانات المحافظ والمعاملات التالية وقدم 3-5 توصيات ذكية وملموسة للمستخدم.
    يجب أن تركز التوصيات على: تحسين استخدام المحافظ، تجنب نفاد الحد الشهري، فرص نقل الأموال بين المحافظ،
    وأي أنماط أو مشكلات تلاحظها.

    بيانات المحافظ:
    ${JSON.stringify(walletsData)}

    المعاملات الأخيرة:
    ${JSON.stringify(walletTransactions)}

    أريد تنسيق الاستجابة كمصفوفة من الكائنات، كل كائن يمثل توصية واحدة بالتنسيق التالي:
    {
      "type": "نوع التوصية (usage, transfer, alert, insight)",
      "title": "عنوان موجز للتوصية",
      "description": "وصف مفصل للتوصية يشرح المنطق وراءها",
      "actionText": "نص زر الإجراء (اختياري)",
      "actionType": "نوع الإجراء (positive, negative, neutral)",
      "priority": "أولوية التوصية (high, medium, low)"
    }

    استجب بتنسيق JSON فقط بحيث يكون المفتاح الرئيسي هو "recommendations" ويحتوي على مصفوفة من التوصيات.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{"recommendations":[]}';
    const result = JSON.parse(content);
    const recommendations = result.recommendations || [];
    
    // إضافة الطابع الزمني لكل توصية
    const recommendationsWithTimestamp = recommendations.map((rec: any) => ({
      ...rec,
      timestamp: new Date().toISOString()
    }));
    
    return res.json(recommendationsWithTimestamp);
  } catch (error) {
    console.error('خطأ في إنشاء التوصيات الذكية:', error);
    
    // إرجاع توصية افتراضية واحدة في حالة الخطأ
    return res.status(500).json([{
      type: 'insight',
      title: 'راقب أنماط استخدامك',
      description: 'تتبع معدل استخدامك اليومي لمحافظك للمساعدة في تحسين إدارة الحدود الشهرية.',
      priority: 'medium',
      timestamp: new Date().toISOString()
    }]);
  }
}

/**
 * الحصول على استجابة من المساعد الافتراضي الذكي
 */
export async function getAIAssistantResponseHandler(req: Request, res: Response) {
  try {
    const { question, wallets, transactions } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'السؤال مطلوب' });
    }

    // تجميع بيانات المحافظ
    const walletsData = (wallets || []).map((w: any) => ({
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
      ? transactions
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 20)
      : [];

    const prompt = `
    أنت مساعد ذكي متخصص في إدارة محافظ فودافون كاش.
    
    بيانات المستخدم:
    
    المحافظ:
    ${JSON.stringify(walletsData)}
    
    المعاملات الأخيرة:
    ${JSON.stringify(recentTransactions)}
    
    سؤال المستخدم:
    ${question}
    
    قدم إجابة مفيدة ودقيقة بالعربية على سؤال المستخدم، مستنداً إلى بيانات محافظهم ومعاملاتهم.
    اجعل إجابتك:
    1. مباشرة ومحددة
    2. مدعومة بالبيانات الفعلية
    3. تقدم توصيات عملية عند الحاجة
    4. قصيرة وموجزة (50-100 كلمة)
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    });

    const assistantResponse = response.choices[0].message.content || '';
    return res.json({ response: assistantResponse });
  } catch (error) {
    console.error('خطأ في الحصول على استجابة المساعد الافتراضي:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ أثناء معالجة طلبك',
      response: 'عذراً، لم أتمكن من معالجة سؤالك في الوقت الحالي. يرجى المحاولة مرة أخرى لاحقاً.' 
    });
  }
}