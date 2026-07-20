"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [kontak, setKontak] = useState({ namaKetua: "Admin", noTelpon: "-" });

  useEffect(() => {
    const fetchKontak = async () => {
      const snap = await getDoc(doc(db, "pengaturan", "kontak"));
      if(snap.exists()) setKontak(snap.data());
    };
    fetchKontak();
  }, []);

  const navLinks = [
    { name: "Beranda", path: "/beranda" },
    { name: "Profil", path: "/profil" },
    { name: "Media & Publikasi", path: "/kehidupan" },
    { name: "Jaringan Alumni", path: "/alumni" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            <Link href="/" className="flex items-center gap-3 group">
              <img 
                src="/mersi.png" 
                alt="Logo Mersi" 
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" 
              />
              <span className="font-serif font-bold text-xl text-slate-900">Merapi Singgalang</span>
            </Link>

            <div className="hidden md:flex space-x-8">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.path} className={`text-sm font-semibold transition-colors py-2 border-b-2 ${pathname === link.path ? "border-red-800 text-red-800" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
                  {link.name}
                </Link>
              ))}
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.path} onClick={() => setIsMenuOpen(false)} className={`block px-4 py-3 rounded-lg font-medium text-sm ${pathname === link.path ? "bg-red-50 text-red-800" : "text-slate-600"}`}>
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-grow">{children}</main>

      {/* FOOTER */}
      <footer className="bg-[#0f172a] text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/mersi.png" alt="Logo Mersi" className="w-17 h-17 object-contain opacity-90" />
              <span className="font-serif font-bold text-xl text-white">Merapi Singgalang</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Etalase prestasi dan repositori intelektual warga Asrama Mahasiswa Merapi Singgalang. Mengedepankan nilai kekeluargaan dan semangat perantau Minangkabau.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6 tracking-wide">Hubungi Kami</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span className="leading-relaxed">Jl. Marga Agung, Karangwaru, Kec. Tegalrejo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55241</span>
              </li>
              <li className="flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>Ketua: {kontak.namaKetua} ({kontak.noTelpon})</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6 tracking-wide">Sosial Media</h3>
            <a href="#" className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              @asramamerapisinggalang
            </a>
          </div>

        </div>
      </footer>
    </div>
  );
}
