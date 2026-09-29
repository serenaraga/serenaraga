import { fetchBrandSettingsServer } from "@/lib/brand-settings-server";
import { LandingPageView } from "@/components/landing-page-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const initialSettings = await fetchBrandSettingsServer();
  return <LandingPageView initialSettings={initialSettings} />;
}
