import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PortalAuthGuard from "./PortalAuthGuard";

export default function StudentPortalPage() {
  return (
    <>
      <Navbar />
      <PortalAuthGuard role="student" />
      <Footer />
    </>
  );
}
