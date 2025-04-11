import React from "react";
import { useStore } from "@/lib/zustand-store";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBanner() {
  const { currentNotification, clearNotification, markNotificationAsRead } = useStore();
  
  if (!currentNotification) {
    return null;
  }
  
  const getBannerStyles = () => {
    switch (currentNotification.type) {
      case "success":
        return "bg-primary-100 border-b border-primary-200";
      case "warning":
        return "bg-yellow-100 border-b border-yellow-200";
      case "error":
        return "bg-red-100 border-b border-red-200";
      case "info":
        return "bg-blue-100 border-b border-blue-200";
      default:
        return "bg-gray-100 border-b border-gray-200";
    }
  };
  
  const getIconStyles = () => {
    switch (currentNotification.type) {
      case "success":
        return "text-primary-700";
      case "warning":
        return "text-yellow-700";
      case "error":
        return "text-red-700";
      case "info":
        return "text-blue-700";
      default:
        return "text-gray-700";
    }
  };
  
  const getTextStyles = () => {
    switch (currentNotification.type) {
      case "success":
        return "text-primary-900";
      case "warning":
        return "text-yellow-900";
      case "error":
        return "text-red-900";
      case "info":
        return "text-blue-900";
      default:
        return "text-gray-900";
    }
  };
  
  const getButtonStyles = () => {
    switch (currentNotification.type) {
      case "success":
        return "text-primary-700 hover:text-primary-900";
      case "warning":
        return "text-yellow-700 hover:text-yellow-900";
      case "error":
        return "text-red-700 hover:text-red-900";
      case "info":
        return "text-blue-700 hover:text-blue-900";
      default:
        return "text-gray-700 hover:text-gray-900";
    }
  };
  
  const getIcon = () => {
    switch (currentNotification.type) {
      case "success":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${getIconStyles()}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case "warning":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${getIconStyles()}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case "error":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${getIconStyles()}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case "info":
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${getIconStyles()}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };
  
  const handleClose = () => {
    markNotificationAsRead(currentNotification.id);
    clearNotification();
  };
  
  return (
    <div className={getBannerStyles()}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {getIcon()}
          <p className={getTextStyles()}>{currentNotification.message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={getButtonStyles()}
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
