import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PortalAuthGuard from "./PortalAuthGuard";
import AdminDashboard from "./AdminDashboard";

export default function AdminPortalPage() {
  return (
    <>
      <Navbar />
      <PortalAuthGuard role="admin">
        <AdminDashboard />
      </PortalAuthGuard>
      <Footer />
    </>
  );
}
