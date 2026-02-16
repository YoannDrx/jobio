"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Users, Activity, TrendingUp, Target } from "lucide-react";

// Mock data for now - will be replaced with real data from API
const mockMetrics = {
  newUsers7d: 12,
  newUsers30d: 45,
  activationRate: 68,
  wau: 89,
  mau: 234,
  conversionRate: 12,
  topFeatures: [
    { name: "Mission Creation", count: 156 },
    { name: "Follow-up", count: 134 },
    { name: "Contact Added", count: 98 },
    { name: "CV Coach", count: 67 },
    { name: "Invoice Generated", count: 45 },
  ],
};

export function AnalyticsDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Produit</h1>
        <p className="text-muted-foreground">Métriques clés et usage</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Nouveaux utilisateurs (7j)
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.newUsers7d}</div>
            <p className="text-muted-foreground text-xs">
              +{mockMetrics.newUsers30d} (30j)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activation</CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMetrics.activationRate}%
            </div>
            <p className="text-muted-foreground text-xs">
              % avec first mission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">WAU / MAU</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMetrics.wau} / {mockMetrics.mau}
            </div>
            <p className="text-muted-foreground text-xs">
              Ratio: {Math.round((mockMetrics.wau / mockMetrics.mau) * 100)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMetrics.conversionRate}%
            </div>
            <p className="text-muted-foreground text-xs">Free → Paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage (Top 5)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockMetrics.topFeatures.map((feature, index) => (
              <div key={feature.name} className="flex items-center gap-4">
                <span className="text-muted-foreground w-8 text-sm">
                  #{index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span>{feature.name}</span>
                    <span className="font-medium">{feature.count}</span>
                  </div>
                  <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        width: `${(feature.count / mockMetrics.topFeatures[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <div className="bg-muted rounded-lg p-4 text-sm">
        <p className="text-muted-foreground">
          <strong>Note:</strong> Ces métriques sont des placeholders. Connectez
          PostHog ou votre outil d&apos;analytics pour des données réelles.
        </p>
      </div>
    </div>
  );
}
