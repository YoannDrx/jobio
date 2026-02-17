import HomePage from "../page";
import { buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";

export const metadata = buildMarketingMetadata({
  title: SiteConfig.title,
  description: SiteConfig.description,
  path: "/",
  noIndex: true,
});

export default function LandingPage() {
  return <HomePage />;
}
