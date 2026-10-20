import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ToastProvider } from "@/components/Toast";
import CookieBanner from "@/components/CookieBanner";
import { getAllSettings, getPublicSettings, siteUrl } from "@/lib/settings";

// Store settings live in the database and are editable from the admin panel, so render on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = getAllSettings();
  const title = s.seo_title || s.store_name || "Online Store";
  const description = s.seo_description || s.store_tagline || "";
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${s.store_name || "Store"}` },
    description,
    openGraph: { title, description, siteName: s.store_name, type: "website", images: ["/tellora-logo.png"] },
    twitter: { card: "summary_large_image", title, description },
    icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/apple-touch-icon.png" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = getPublicSettings();
  const analyticsId = getAllSettings().analytics_id || "";
  return (
    <html lang="en">
      <body>
        <SettingsProvider initial={settings}>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <WishlistProvider>
                  {children}
                  <CookieBanner analyticsId={analyticsId} />
                </WishlistProvider>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
