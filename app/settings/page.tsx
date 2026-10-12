import { getSiteSettings } from "@/lib/site";
import SiteSettings from "@/components/SiteSettings";
import { requireAdminPage } from "@/lib/auth";
import AdminOnly from "@/components/AdminOnly";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "메인 화면 설정",
  robots: { index: false, follow: false },
};
export default async function SettingsPage() {
  await requireAdminPage("/settings");
  return (
    <AdminOnly returnTo="/settings">
      <SiteSettings
        initial={getSiteSettings()}
        canSave={process.env.NODE_ENV === "development"}
      />
    </AdminOnly>
  );
}
