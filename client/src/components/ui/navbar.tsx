import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  LineChart, 
  Home, 
  Menu, 
  Bell,
  Sparkles
} from "lucide-react";
import { useOffline } from "@/hooks/use-offline";
import { useStore } from "@/lib/zustand-store";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location] = useLocation();
  const isOffline = useOffline();
  const { notifications } = useStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    {
      label: "الرئيسية",
      href: "/",
      icon: <Home className="h-5 w-5" />,
      active: location === "/" || location === ""
    },
    {
      label: "تحليلات",
      href: "/ai-insights",
      icon: <Sparkles className="h-5 w-5" />,
      active: location === "/ai-insights"
    }
  ];

  // التبديل بين عرض وإخفاء القائمة على الشاشات الصغيرة
  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
  }

  return (
    <div className="h-16 fixed inset-x-0 top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b">
      <nav className="h-full flex items-center justify-between px-4 container max-w-7xl mx-auto">
        <div className="flex items-center gap-1.5">
          <Link href="/">
            <button className="flex items-center gap-2 font-cairo font-bold text-xl">
              <Wallet className="h-6 w-6 text-purple-600" />
              <span>محفظتي</span>
            </button>
          </Link>
          
          {isOffline && (
            <Badge variant="outline" className="border-orange-500 text-orange-500 text-xs">
              وضع عدم الاتصال
            </Badge>
          )}
        </div>
        
        {/* عناصر التنقل للشاشات الكبيرة */}
        <div className="hidden md:flex items-center space-x-4 space-x-reverse">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </Link>
          ))}
        </div>
        
        {/* زر القائمة للشاشات الصغيرة */}
        <div className="flex md:hidden">
          <button
            className="text-muted-foreground hover:text-foreground p-2 rounded-md"
            onClick={toggleMenu}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        
        {/* القائمة المنسدلة للشاشات الصغيرة */}
        {isMenuOpen && (
          <div className="absolute top-16 inset-x-0 bg-background border-b md:hidden">
            <div className="p-4 space-y-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "flex items-center gap-2 w-full px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      item.active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}