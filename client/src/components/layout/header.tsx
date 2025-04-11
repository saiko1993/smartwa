import React from "react";
import { NotificationsIndicator } from "@/components/ui/notifications";
import { useStore } from "@/lib/zustand-store";
import { useOffline } from "@/hooks/use-offline";
import { Settings } from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Header() {
  const isOffline = useOffline();
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8V7a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-1" />
                <path d="M10 8V4" />
                <path d="M16 19h6" />
                <path d="M19 16v6" />
              </svg>
              <h1 className="text-xl md:text-2xl font-bold text-primary-700">محفظتي</h1>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <OfflineIndicator isOffline={isOffline} />
          <NotificationsIndicator />
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}

interface OfflineIndicatorProps {
  isOffline: boolean;
}

function OfflineIndicator({ isOffline }: OfflineIndicatorProps) {
  if (isOffline) {
    return (
      <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-1.5 shadow-sm">
        <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
        <span>غير متصل</span>
      </div>
    );
  }

  return (
    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1.5 shadow-sm">
      <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
      <span>متصل</span>
    </div>
  );
}

function SettingsMenu() {
  const { exportData } = useStore();

  const handleExport = async () => {
    try {
      const data = await exportData();
      const filename = `mahfazhati-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExport}>
          تصدير البيانات
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/#backup-restore">
            النسخ الاحتياطي والاستعادة
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
