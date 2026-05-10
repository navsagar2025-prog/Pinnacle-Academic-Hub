import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PortalAuthGuard from "./PortalAuthGuard";

export default function ParentPortalPage() {
  return (
    <>
      <Navbar />
      <PortalAuthGuard role="parent" />
      <Footer />
    </>
  );
}
