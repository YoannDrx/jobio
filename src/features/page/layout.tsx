import type { ComponentPropsWithoutRef } from "react";
import { Typography } from "../../components/nowts/typography";
import { cn } from "../../lib/utils";

export const Layout = (
  props: ComponentPropsWithoutRef<"div"> & {
    size?: "sm" | "default" | "lg" | "xl";
  },
) => {
  const resolvedSize = props.size ?? "default";

  return (
    <div
      {...props}
      className={cn(
        "mt-1 flex w-full flex-wrap gap-4 px-1.5 sm:px-2.5 lg:px-3.5",
        {
          "mx-auto max-w-5xl": resolvedSize === "sm",
          "max-w-none": resolvedSize !== "sm",
        },
        props.className,
      )}
    />
  );
};

export const LayoutHeader = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className={cn(
        "flex w-full min-w-[200px] flex-col items-start gap-2 md:flex-1",
        props.className,
      )}
    />
  );
};

export const LayoutTitle = (props: ComponentPropsWithoutRef<"h1">) => {
  return <Typography {...props} variant="h2" className={cn(props.className)} />;
};

export const LayoutDescription = (props: ComponentPropsWithoutRef<"p">) => {
  return <Typography {...props} className={cn(props.className)} />;
};

export const LayoutActions = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div {...props} className={cn("flex items-center", props.className)} />
  );
};

export const LayoutContent = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className={cn("w-full", props.className)} />;
};
