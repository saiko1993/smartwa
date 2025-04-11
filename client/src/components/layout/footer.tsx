import React from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-8">
      <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
        <p>© {currentYear} محفظتي - جميع الحقوق محفوظة</p>
        <p className="mt-1">تطبيق لإدارة المحافظ الإلكترونية يعمل بدون إنترنت</p>
      </div>
    </footer>
  );
}
