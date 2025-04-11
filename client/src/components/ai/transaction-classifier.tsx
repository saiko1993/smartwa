import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Tag, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { classifyTransaction } from "@/lib/ai-services";

export function TransactionClassifier() {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleClassify = async () => {
    if (!description.trim()) {
      toast({
        title: "الوصف مطلوب",
        description: "يرجى إدخال وصف للمعاملة ليتم تصنيفها.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await classifyTransaction(description);
      setCategory(result.category);
      setConfidence(result.confidence);
    } catch (err) {
      console.error("خطأ في تصنيف المعاملة:", err);
      setError("حدث خطأ أثناء تصنيف المعاملة. يرجى المحاولة مرة أخرى.");
      toast({
        title: "فشل التصنيف",
        description: "لم نتمكن من تصنيف هذه المعاملة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.5) return "text-amber-600";
    return "text-red-600";
  };
  
  const getConfidenceText = () => {
    if (confidence >= 0.8) return "ثقة عالية";
    if (confidence >= 0.5) return "ثقة متوسطة";
    return "ثقة منخفضة";
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          تصنيف المعاملات الذكي
        </CardTitle>
        <CardDescription>
          أدخل وصف المعاملة ليتم تصنيفها تلقائياً باستخدام الذكاء الاصطناعي
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أدخل وصف المعاملة هنا... (مثال: تحويل مبلغ 5000 جنيه إلى محمد)"
              className="w-full"
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          {category && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-base">الفئة:</span>
                <span className="text-primary font-bold">{category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">مستوى الثقة:</span>
                <span className={`text-sm font-medium ${getConfidenceColor()}`}>
                  {getConfidenceText()} ({Math.round(confidence * 100)}%)
                </span>
              </div>
              
              <div className="mt-3 w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${confidence >= 0.8 ? 'bg-green-500' : confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleClassify} 
          disabled={isLoading || !description.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جاري التصنيف...
            </>
          ) : category ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              تصنيف مرة أخرى
            </>
          ) : (
            "تصنيف المعاملة"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}