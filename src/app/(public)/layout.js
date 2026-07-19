import Navbar from "@/components/global/Navbar";
import Footer from "@/components/global/Footer";

export default function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50">{children}</main>
      <Footer />
    </div>
  );
}