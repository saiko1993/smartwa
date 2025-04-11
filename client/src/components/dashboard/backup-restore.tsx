import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/zustand-store";
import { formatDateAr } from "@/lib/utils";
import { Download, Upload, Clock, CheckCircle2 } from "lucide-react";
import { downloadJSON, readFileAsJSON } from "@/lib/utils";

export function BackupRestore() {
  const { 
    exportData, 
    importData, 
    autoBackupEnabled, 
    autoBackupFrequency, 
    lastBackupDate,
    setAutoBackup,
    setAutoBackupFrequency
  } = useStore();
  
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportData();
      const filename = `mahfazhati-backup-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJSON(data, filename);
      
      await useStore.getState().addNotification({
        title: "تم تصدير البيانات",
        message: "تم تصدير البيانات بنجاح",
        type: "success"
      });
    } catch (error) {
      console.error("Failed to export data:", error);
      
      await useStore.getState().addNotification({
        title: "فشل تصدير البيانات",
        message: "حدث خطأ أثناء تصدير البيانات",
        type: "error"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      const data = await readFileAsJSON(file);
      await importData(data);
      
      await useStore.getState().addNotification({
        title: "تم استيراد البيانات",
        message: "تم استيراد البيانات بنجاح",
        type: "success"
      });
    } catch (error) {
      console.error("Failed to import data:", error);
      
      await useStore.getState().addNotification({
        title: "فشل استيراد البيانات",
        message: "حدث خطأ أثناء استيراد البيانات. تأكد من صحة الملف.",
        type: "error"
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const toggleAutoBackup = async () => {
    try {
      await setAutoBackup(!autoBackupEnabled);
    } catch (error) {
      console.error("Failed to toggle auto backup:", error);
    }
  };
  
  const handleFrequencyChange = async (value: string) => {
    try {
      await setAutoBackupFrequency(value as any);
    } catch (error) {
      console.error("Failed to change auto backup frequency:", error);
    }
  };
  
  return (
    <div id="backup-restore" className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold">النسخ الاحتياطي والاستعادة</h2>
        {lastBackupDate && (
          <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal">
            <Clock className="h-3 w-3 text-gray-500" />
            <span>آخر نسخ: {formatDateAr(lastBackupDate)}</span>
          </Badge>
        )}
      </div>
      
      <Card className="overflow-hidden border border-gray-100">
        <Tabs defaultValue="backup" className="w-full">
          <div className="px-4 pt-3 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="backup" className="text-sm">تصدير واستيراد</TabsTrigger>
              <TabsTrigger value="auto" className="text-sm">النسخ التلقائي</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="backup" className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/20 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-4 w-4 text-purple-600" />
                  <h3 className="font-medium text-sm">تصدير البيانات</h3>
                </div>
                <Button 
                  className="w-full mt-1 bg-purple-600 hover:bg-purple-700 text-xs"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? "جاري التصدير..." : "تصدير إلى ملف JSON"}
                </Button>
              </div>
              
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-sm">استيراد البيانات</h3>
                </div>
                <Button 
                  variant="outline"
                  className="w-full mt-1 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                  size="sm"
                  onClick={handleOpenFileDialog}
                  disabled={isImporting}
                >
                  {isImporting ? "جاري الاستيراد..." : "اختيار ملف JSON"}
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".json" 
                  onChange={handleImport}
                  disabled={isImporting}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="auto" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Switch 
                  id="auto-backup" 
                  checked={autoBackupEnabled}
                  onCheckedChange={toggleAutoBackup}
                />
                <Label htmlFor="auto-backup" className="text-sm">
                  تمكين النسخ الاحتياطي التلقائي
                </Label>
              </div>
              
              {autoBackupEnabled && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> مفعل
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Button 
                variant={autoBackupFrequency === 'daily' ? 'default' : 'outline'} 
                className="text-xs py-1 px-2"
                onClick={() => handleFrequencyChange('daily')}
                disabled={!autoBackupEnabled}
              >
                يومي
              </Button>
              <Button 
                variant={autoBackupFrequency === 'weekly' ? 'default' : 'outline'} 
                className="text-xs py-1 px-2"
                onClick={() => handleFrequencyChange('weekly')}
                disabled={!autoBackupEnabled}
              >
                أسبوعي
              </Button>
              <Button 
                variant={autoBackupFrequency === 'monthly' ? 'default' : 'outline'} 
                className="text-xs py-1 px-2"
                onClick={() => handleFrequencyChange('monthly')}
                disabled={!autoBackupEnabled}
              >
                شهري
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              سيتم حفظ نسخة احتياطية من بياناتك تلقائياً بالتكرار المحدد على هذا الجهاز.
            </p>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
