import React, { useState, useRef, useEffect } from "react";
import { getAIAssistantResponse } from "@/lib/ai-services";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Loader2, Send, User, Zap, ArrowRight } from "lucide-react";

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: 'مرحباً بك في مساعد محفظتي الذكي! يمكنك سؤالي عن محافظك، أو طلب المساعدة في تحليل معاملاتك، أو الحصول على توصيات لتحسين استخدام المحافظ.',
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { toast } = useToast();
  
  // الحصول على بيانات المحافظ والمعاملات
  const { wallets } = useWallets();
  const { transactions } = useTransactions();

  // التمرير التلقائي إلى أسفل عند إضافة رسائل جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // اقتراحات أسئلة للمستخدم
  const questionSuggestions = [
    'ما هي أفضل محفظة للإرسال هذا الأسبوع؟',
    'متى سينفد الحد الشهري لمحفظتي الرئيسية؟',
    'حلل أنماط معاملاتي في الشهر الماضي',
    'ما هي التوصيات لتحسين استخدام محافظي؟'
  ];

  // إرسال سؤال المستخدم وتلقي الرد
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // إضافة رسالة المستخدم
    const userMessage: AIMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    
    try {
      // الحصول على الرد من خدمة الذكاء الاصطناعي
      const response = await getAIAssistantResponse(
        userInput,
        wallets,
        transactions
      );
      
      // إضافة رد المساعد
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('خطأ في الحصول على رد المساعد:', error);
      toast({
        title: 'حدث خطأ',
        description: 'لم نتمكن من الحصول على رد. يرجى المحاولة مرة أخرى.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // استخدام اقتراح سؤال
  const useSuggestion = (suggestion: string) => {
    setUserInput(suggestion);
  };

  return (
    <Card className="flex flex-col h-[600px] w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-cairo text-lg">مساعد محفظتي الذكي</CardTitle>
            <CardDescription className="text-xs">
              استخدم المساعد للحصول على تحليلات وتوصيات مخصصة
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto pb-0">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                flex max-w-[80%] items-start gap-2 rounded-lg px-3 py-2
                ${message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/60 text-foreground'}
              `}>
                {message.role === 'assistant' && 
                  <Bot className="h-5 w-5 mt-1" />
                }
                <div>
                  <div className="text-sm">{message.content}</div>
                  <div className="mt-1 text-[10px] opacity-70">
                    {message.timestamp.toLocaleTimeString('ar-EG')}
                  </div>
                </div>
                {message.role === 'user' && 
                  <User className="h-5 w-5 mt-1" />
                }
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          
          {/* اقتراحات الأسئلة */}
          {messages.length === 1 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">يمكنك تجربة إحدى هذه الأسئلة:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {questionSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start text-xs h-auto py-2 text-muted-foreground hover:text-foreground"
                    onClick={() => useSuggestion(suggestion)}
                  >
                    <ArrowRight className="h-3 w-3 ml-1 text-primary" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-3">
        <div className="flex w-full items-center gap-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 min-h-10 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}