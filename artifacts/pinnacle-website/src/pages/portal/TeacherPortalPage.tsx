import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PortalAuthGuard from "./PortalAuthGuard";

export default function TeacherPortalPage() {
  return (
    <>
      <Navbar />
      <PortalAuthGuard role="teacher" />
      <Footer />
    </>
  );
}
