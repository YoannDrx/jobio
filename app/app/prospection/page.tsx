"use client";

import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformsGrid } from "@/features/platforms/components/platforms-grid";
import { CompanyList } from "@/features/companies/components/company-list";

export default function PlatformsPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Prospection</LayoutTitle>
      </LayoutHeader>

      <LayoutContent>
        <Tabs defaultValue="platforms">
          <TabsList>
            <TabsTrigger value="platforms">Plateformes</TabsTrigger>
            <TabsTrigger value="companies">Entreprises</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms">
            <PlatformsGrid />
          </TabsContent>

          <TabsContent value="companies">
            <CompanyList />
          </TabsContent>
        </Tabs>
      </LayoutContent>
    </Layout>
  );
}
