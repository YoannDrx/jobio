"use client";

import {
  SheetContent,
  SheetFooter,
  SheetHeader,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SheetContentProps = React.ComponentProps<typeof SheetContent>;
type SheetHeaderProps = React.ComponentProps<typeof SheetHeader>;
type SheetFooterProps = React.ComponentProps<typeof SheetFooter>;

export function FreelanceSideSheetContent({
  className,
  side,
  ...props
}: SheetContentProps) {
  return (
    <SheetContent
      side={side ?? "right"}
      className={cn(
        "w-full overflow-y-auto p-0 sm:max-w-[34rem] lg:max-w-[36rem] xl:max-w-[38rem]",
        className,
      )}
      {...props}
    />
  );
}

export function FreelanceSideSheetHeader({
  className,
  ...props
}: SheetHeaderProps) {
  return <SheetHeader className={cn("border-b px-7 py-6", className)} {...props} />;
}

export function FreelanceSideSheetFooter({
  className,
  ...props
}: SheetFooterProps) {
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

export function FreelanceSideSheetBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("space-y-6 px-7 py-6", className)} {...props} />;
}
