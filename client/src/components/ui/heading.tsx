import React from "react";
import { cn } from "@/lib/utils";

interface HeadingProps {
  title: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
}

export function Heading({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
  children,
}: HeadingProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <h2 className={cn("text-2xl font-bold tracking-tight", titleClassName)}>
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-sm text-muted-foreground",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}