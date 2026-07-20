import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { RecentPurchaseToast } from "@/components/shared/RecentPurchaseToast";
import { WhatsAppFab } from "@/components/shared/WhatsAppFab";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <RecentPurchaseToast />
      <WhatsAppFab />
    </div>
  );
}
