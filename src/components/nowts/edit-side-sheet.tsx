"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SheetRootProps = React.ComponentProps<typeof Sheet>;
type SheetContentProps = React.ComponentProps<typeof SheetContent>;
type SheetHeaderProps = React.ComponentProps<typeof SheetHeader>;
type SheetFooterProps = React.ComponentProps<typeof SheetFooter>;

export function EditSideSheet({ ...props }: SheetRootProps) {
  return <Sheet {...props} />;
}

export function EditSideSheetContent({
  className,
  side,
  ...props
}: SheetContentProps) {
  return (
    <SheetContent
      side={side ?? "right"}
      className={cn("w-full overflow-y-auto p-0 sm:max-w-2xl", className)}
      {...props}
    />
  );
}

export function EditSideSheetHeader({
  className,
  children,
  title,
  description,
  ...props
}: SheetHeaderProps & { title?: string; description?: string }) {
  return (
    <SheetHeader className={cn("border-b px-7 py-6", className)} {...props}>
      {title && <SheetTitle>{title}</SheetTitle>}
      {description && <SheetDescription>{description}</SheetDescription>}
      {children}
    </SheetHeader>
  );
}

export function EditSideSheetBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-6 px-7 py-6", className)}
      {...props}
    />
  );
}

export function EditSideSheetFooter({ className, ...props }: SheetFooterProps) {
  return (
    <SheetFooter
      className={cn(
        "!flex-row items-center justify-end border-t px-7 py-5",
        className,
      )}
      {...props}
    />
  );
}
