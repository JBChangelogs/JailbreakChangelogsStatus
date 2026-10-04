"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

// Right-side drawer only; the main site's other sides aren't used here.
function SheetContent({
  className,
  overlayClassName,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  overlayClassName?: string;
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-2000 bg-black/40 backdrop-blur-sm",
          overlayClassName,
        )}
      />
      <SheetPrimitive.Content
        className={cn(
          "bg-primary-bg/75 border-border-card text-primary-text data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed inset-y-0 right-0 z-2000 h-full w-3/4 gap-4 border-l p-6 shadow-lg backdrop-blur-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 sm:max-w-sm",
          className,
        )}
        {...props}
      >
        <SheetPrimitive.Title className="sr-only">
          Navigation Menu
        </SheetPrimitive.Title>
        <SheetPrimitive.Description className="sr-only">
          Navigation links and actions for this panel
        </SheetPrimitive.Description>
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetContent };
