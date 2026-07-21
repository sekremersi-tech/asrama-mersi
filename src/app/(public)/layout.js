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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-12');
        }
      });
    }, { threshold: 0.05 });

    const observeElements = () => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };

    observeElements();
    const mutationObserver = new MutationObserver(observeElements);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    const fetchKontak = async () => {
      const snap = await getDoc(doc(db, "pengaturan", "kontak"));
      if(snap.exists()) setKontak(snap.data());
    };
    fetchKontak();
  }, []);

  // FUNGSI BARU: Mengubah nomor HP menjadi format link WhatsApp internasional yang valid
  const formatWhatsAppLink = (nomor) => {
    if (!nomor || nomor === "-") return "#";
    // Hapus semua karakter yang bukan angka (seperti spasi, strip, tanda plus)
    let bersihkanNomor = nomor.replace(/\D/g, '');
    // Jika dimulai dengan '0', ubah menjadi '62' (kode negara Indonesia)
    if (bersihkanNomor.startsWith('0')) {
      bersihkanNomor = '62' + bersihkanNomor.substring(1);
    }
    return `https://wa.me/${bersihkanNomor}`;
  };

  const navLinks = [
    { name: "Beranda", path: "/beranda" },
    { 
      name: "Profil", 
      path: "/profil",
      subLinks: [
        { name: "Catatan Sejarah", path: "/profil#sejarah" },
        { name: "Visi & Misi", path: "/profil#visimisi" },
        { name: "Garis Waktu", path: "/profil#timeline" },
        { name: "Titik Temu", path: "/profil#lokasi" }
      ]
    },
    { name: "Fasilitas", path: "/fasilitas" },
    { 
      name: "Media & Publikasi", 
      path: "/kehidupan",
      subLinks: [
        { name: "Galeri Kegiatan Asrama", path: "/kehidupan#galeri" },
        { name: "Kabar Terbaru Warga", path: "/kehidupan#kabar" }
      ]
    },
    { 
      name: "Jaringan Alumni", 
      path: "/alumni",
      subLinks: [
        { name: "Jejak Alumni", path: "/alumni#jejak" },
        { name: "Repositori Skripsi", path: "/alumni#repositori" }
      ]
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f9f8f6] font-lora relative">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,500;0,700;1,500;1,700&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-lora { font-family: 'Lora', serif; }
        html { scroll-behavior: smooth; }
        html, body { max-width: 100vw; overflow-x: hidden; }
      `}</style>

      {/* NAVBAR */}
      <nav className="bg-[#fcfbf9]/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-[#e8e4db]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 bg-[#171412] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-[2px_2px_0px_0px_rgba(180,83,9,1)] border border-stone-800 shrink-0">
                <img src="/mersi.png" alt="Logo Mersi" className="w-6 h-6 object-contain" />
              </div>
              <span className="font-playfair font-bold text-lg md:text-xl text-stone-900 tracking-wide leading-tight hidden sm:block">
                Asrama Mahasiswa <br className="hidden lg:block"/><span className="lg:hidden"> </span>Merapi Singgalang
              </span>
            </Link>

            <div className="hidden lg:flex space-x-6 h-full">
              {navLinks.map((link, index) => (
                <div key={link.name} className="relative group h-full flex items-center cursor-pointer">
                  <Link href={link.path} className={`text-sm font-semibold transition-all py-2 border-b-2 ${pathname === link.path ? "border-red-800 text-red-800" : "border-transparent text-stone-600 hover:text-amber-600"}`}>
                    {link.name}
                  </Link>

                  {link.subLinks && (
                    <div className={`absolute top-full pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 ${index >= 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                      <div className="bg-[#fcfbf9] border border-[#e8e4db] rounded-sm shadow-2xl relative">
                        <div className={`absolute -top-2 w-4 h-4 bg-[#fcfbf9] border-l border-t border-[#e8e4db] rotate-45 ${index >= 3 ? 'right-8' : 'left-1/2 -translate-x-1/2'}`}></div>
                        <ul className="relative z-10 flex flex-col py-2">
                          {link.subLinks.map((sub, idx) => (
                            <li key={idx}>
                              <Link href={sub.path} className="block px-6 py-3 text-sm font-lora font-medium text-stone-600 hover:text-red-800 hover:bg-[#f4f2ec] border-l-2 border-transparent hover:border-red-800 transition-colors">
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-stone-500 hover:text-amber-600 shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-stone-100 px-4 py-4 space-y-2 shadow-lg max-h-[80vh] overflow-y-auto">
            {navLinks.map((link) => (
              <div key={link.name}>
                <Link href={link.path} onClick={() => setIsMenuOpen(false)} className={`block px-4 py-3 rounded-lg font-medium text-sm transition-colors ${pathname === link.path ? "bg-red-50 text-red-800 border-l-4 border-red-800" : "text-stone-600 hover:bg-stone-50"}`}>
                  {link.name}
                </Link>
                {link.subLinks && (
                  <div className="pl-6 flex flex-col space-y-1 mt-1 border-l-2 border-stone-100 ml-6">
                    {link.subLinks.map((sub, idx) => (
                      <Link key={idx} href={sub.path} onClick={() => setIsMenuOpen(false)} className="text-sm font-lora text-stone-500 hover:text-red-800 py-2">
                        • {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-grow w-full overflow-x-hidden">{children}</main>

      {/* FOOTER */}
      <footer className="bg-[#171412] text-stone-300 py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800 via-amber-500 to-red-800"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
          
          <div className="lg:col-span-1">
            <div className="flex items-start gap-3 mb-6">
              <img src="/mersi.png" alt="Logo Mersi" className="w-10 h-10 object-contain shrink-0" />
              <span className="font-playfair font-bold text-xl text-white tracking-wide leading-tight">
                Asrama Mahasiswa <br/> Merapi Singgalang
              </span>
            </div>
            <p className="text-sm leading-relaxed text-stone-400 font-lora">Etalase prestasi dan repositori intelektual warga Asrama Mahasiswa Merapi Singgalang. Mengedepankan nilai kekeluargaan dan semangat perantau Minangkabau.</p>
          </div>

          <div>
            <h3 className="text-amber-500 font-bold mb-6 tracking-widest uppercase text-sm font-sans">Navigasi Utama</h3>
            <ul className="space-y-3 text-sm text-stone-400 font-lora">
              <li><Link href="/beranda" className="hover:text-amber-500 transition-colors flex items-center gap-2"><span className="text-stone-600">›</span> Beranda</Link></li>
              <li><Link href="/profil" className="hover:text-amber-500 transition-colors flex items-center gap-2"><span className="text-stone-600">›</span> Profil Asrama</Link></li>
              <li><Link href="/fasilitas" className="hover:text-amber-500 transition-colors flex items-center gap-2"><span className="text-stone-600">›</span> Fasilitas</Link></li>
              <li><Link href="/kehidupan" className="hover:text-amber-500 transition-colors flex items-center gap-2"><span className="text-stone-600">›</span> Media & Publikasi</Link></li>
              <li><Link href="/alumni" className="hover:text-amber-500 transition-colors flex items-center gap-2"><span className="text-stone-600">›</span> Jaringan Alumni</Link></li>
            </ul>
          </div>

          {/* HUBUNGI KAMI (DIPERBARUI MENJADI LINK INTERAKTIF) */}
          <div>
            <h3 className="text-amber-500 font-bold mb-6 tracking-widest uppercase text-sm font-sans">Hubungi Kami</h3>
            <ul className="space-y-4 text-sm text-stone-400 font-lora">
              
              {/* Link Google Maps */}
              <li>
                <a href="https://www.google.com/maps/search/?api=1&query=Asrama+Mahasiswa+Merapi+Singgalang+Yogyakarta" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0 mt-0.5 group-hover:text-amber-500 transition-colors"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span className="leading-relaxed">Jl. Marga Agung, Karangwaru, Kec. Tegalrejo, Kota Yogyakarta 55241</span>
                </a>
              </li>

              {/* Link WhatsApp */}
              <li>
                <a href={formatWhatsAppLink(kontak.noTelpon)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0 group-hover:text-amber-500 transition-colors"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <span>Ketua: {kontak.namaKetua} ({kontak.noTelpon})</span>
                </a>
              </li>

            </ul>
          </div>

          <div>
            <h3 className="text-amber-500 font-bold mb-6 tracking-widest uppercase text-sm font-sans">Sosial Media</h3>
            <div className="flex flex-col gap-4 font-lora">
              <a href="https://www.instagram.com/asramamerapisinggalang" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-stone-400 hover:text-white transition-colors group w-fit">
                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700 group-hover:border-amber-500 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></div> @asramamerapisinggalang
              </a>
              <a href="https://www.tiktok.com/@asrama.mersi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-stone-400 hover:text-white transition-colors group w-fit">
                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700 group-hover:border-amber-500 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg></div> @asrama.mersi
              </a>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-stone-800 text-center relative z-10">
          <p className="text-xs text-stone-500 font-sans tracking-wider">
            © {new Date().getFullYear()} Asrama Mahasiswa Merapi Singgalang Yogyakarta. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
