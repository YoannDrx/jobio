import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/nowts/typography";
import { cn } from "@/lib/utils";
import { Fragment } from "react";
import { PRICING_COMPARISON_CATEGORIES } from "./pricing-matrix";

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="size-4 text-green-600" />
    ) : (
      <X className="text-muted-foreground size-4" />
    );
  }
  return <span>{value}</span>;
}

export function PricingComparisonTable() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 sticky top-0 border-b">
              <th className="px-4 py-4 text-left">
                <Typography variant="small" className="font-semibold">
                  Plan
                </Typography>
              </th>
              <th
                className={cn(
                  "min-w-[120px] px-4 py-4 text-center",
                  "bg-muted/30",
                )}
              >
                <Typography variant="small" className="font-semibold">
                  Free
                </Typography>
              </th>
              <th
                className={cn(
                  "min-w-[120px] px-4 py-4 text-center",
                  "bg-primary/10",
                )}
              >
                <Typography
                  variant="small"
                  className="text-primary font-semibold"
                >
                  Pro
                </Typography>
              </th>
              <th
                className={cn(
                  "min-w-[120px] px-4 py-4 text-center",
                  "bg-muted/30",
                )}
              >
                <Typography variant="small" className="font-semibold">
                  Ultra
                </Typography>
              </th>
            </tr>
          </thead>
          <tbody>
            {PRICING_COMPARISON_CATEGORIES.map((category) => (
              <Fragment key={category.name}>
                <tr>
                  <td
                    colSpan={4}
                    className="bg-muted/20 border-t border-b px-4 py-3"
                  >
                    <Typography variant="h3" className="text-sm">
                      {category.name}
                    </Typography>
                  </td>
                </tr>
                {category.features.map((feature, featureIdx) => (
                  <tr
                    key={`${category.name}-${featureIdx}`}
                    className="hover:bg-muted/30 border-b transition-colors"
                  >
                    <td className="px-4 py-4">
                      <Typography variant="muted">{feature.name}</Typography>
                    </td>
                    <td className={cn("px-4 py-4 text-center", "bg-muted/5")}>
                      <FeatureValue value={feature.free} />
                    </td>
                    <td className={cn("px-4 py-4 text-center", "bg-primary/5")}>
                      <FeatureValue value={feature.pro} />
                    </td>
                    <td className={cn("px-4 py-4 text-center", "bg-muted/5")}>
                      <FeatureValue value={feature.ultra} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
