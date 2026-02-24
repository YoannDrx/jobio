import { PlatformsGrid } from "@/features/platforms/components/platforms-grid";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function PlatformsPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Plateformes</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <PlatformsGrid />
      </LayoutContent>
    </Layout>
  );
}
