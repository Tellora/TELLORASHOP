import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import MaintenanceGate from '@/components/MaintenanceGate';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <MaintenanceGate>
      <Navbar />
      <CartDrawer />
      <main>{children}</main>
      <Footer />
    </MaintenanceGate>
  );
}
