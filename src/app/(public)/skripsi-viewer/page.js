"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function SecureViewerContent() {
  const searchParams = useSearchParams();
  const skripsiId = searchParams.get("id");
  const namaPeminta = searchParams.get("nama") || "NN";
  const hpPeminta = searchParams.get("hp") || "08xx";

  const [skripsi, setSkripsi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);

  // Mencegah screenshot desktop dengan memburamkan saat window tidak fokus
  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) setIsBlurred(true);
    });

    const handleKeyDown = (e) => {
      if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's')) {
        navigator.clipboard.writeText("Akses disalin ditolak.");
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 3000);
      }
    };
    
    const handleCopy = (e) => {
       e.preventDefault();
       alert("Menyalin konten ini tidak diizinkan.");
    }

    window.addEventListener("keyup", handleKeyDown);
    window.addEventListener("copy", handleCopy);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("keyup", handleKeyDown);
      window.removeEventListener("copy", handleCopy);
    };
  }, []);

  useEffect(() => {
    const fetchSkripsi = async () => {
      if (!skripsiId) {
        setError("Akses Ditolak: Link tidak valid.");
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "skripsi", skripsiId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSkripsi(docSnap.data());
        } else {
          setError("Dokumen skripsi tidak ditemukan.");
        }
      } catch (err) {
        setError("Terjadi kesalahan sistem.");
      } finally {
        setLoading(false);
      }
    };
    fetchSkripsi();
  }, [skripsiId]);

  const getPageImageUrl = (pdfUrl, pageNumber) => {
    if (!pdfUrl) return "";
    let cleanUrl = pdfUrl.replace("fl_attachment/", "");
    cleanUrl = cleanUrl.replace(/\.pdf$/i, ".jpg");
    return cleanUrl.replace("/upload/", `/upload/pg_${pageNumber}/`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#1c1917] text-stone-300 font-lora text-lg">Menyiapkan Ruang Baca Rahasia...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#1c1917] text-red-500 font-bold font-lora text-xl">{error}</div>;

  return (
    <div 
      className="min-h-screen bg-[#1c1917] relative select-none overflow-x-hidden"
      onContextMenu={(e) => e.preventDefault()} 
      style={{ 
        WebkitTouchCallout: "none", 
        WebkitUserSelect: "none", 
        userSelect: "none",
        pointerEvents: isBlurred ? "none" : "auto" 
      }} 
    >
      {/* Peringatan Saat Layar Tidak Fokus */}
      {isBlurred && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-red-500 font-bold p-8 text-center gap-6 shadow-[0_0_100px_rgba(220,38,38,0.5)]">
          <div className="bg-red-500/20 p-6 rounded-full border-2 border-red-500/50">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
          </div>
          <div>
            <h2 className="text-2xl font-playfair mb-2">Akses Dihentikan Sementara</h2>
            <p className="text-red-300 font-sans text-sm tracking-wide font-normal max-w-md mx-auto leading-relaxed">
              Tindakan Merekam/Screenshot atau kehilangan fokus layar terdeteksi. Sistem secara otomatis memburamkan konten untuk melindungi hak cipta skripsi.
            </p>
          </div>
        </div>
      )}

      {/* Header Info - Minimalis Tanpa Logo Asrama */}
      <div className="bg-[#171412] border-b border-[#292524] py-4 px-6 md:px-12 sticky top-0 z-40 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md gap-4">
        <div className="max-w-3xl">
          <h1 className="text-stone-200 font-bold font-playfair text-lg md:text-xl line-clamp-2 leading-snug mb-1">{skripsi.judul}</h1>
          <p className="text-amber-600/80 text-xs font-sans tracking-widest uppercase font-bold">Penulis: {skripsi.nama} ({skripsi.tahun})</p>
        </div>
        <div className="bg-[#450a0a] border border-[#7f1d1d] text-red-200 px-4 py-2 rounded-sm text-xs font-bold whitespace-nowrap shadow-sm shrink-0 uppercase tracking-wider flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          HANYA BACA (3 HALAMAN)
        </div>
      </div>

      {/* Area Dokumen dengan Watermark Rapat */}
      <div className={`relative max-w-4xl mx-auto py-12 px-4 transition-all duration-300 ${isBlurred ? 'blur-[10px] opacity-30 grayscale' : 'opacity-100'}`}>
        
        {/* WATERMARK BERJALAN YANG SANGAT RAPAT (Anti-Screenshot HP) */}
        <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden opacity-[0.08] mix-blend-overlay flex justify-center items-center">
          <div className="w-[300%] h-[300%] flex flex-wrap justify-center items-center gap-4 rotate-[-35deg]">
            {Array.from({ length: 400 }).map((_, i) => (
              <span key={i} className="text-xl md:text-3xl font-black text-black uppercase tracking-widest whitespace-nowrap drop-shadow-md">
                DIBACA OLEH {namaPeminta} ({hpPeminta}) - HAK CIPTA MERSI 
              </span>
            ))}
          </div>
        </div>

        {/* Gambar Halaman 1, 2, 3 */}
        <div className="space-y-12 relative z-20 flex flex-col items-center">
          {[1, 2, 3].map((page) => (
            <div key={page} className="bg-white rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative w-full max-w-[800px] border border-stone-200 overflow-hidden">
              <div className="absolute top-4 right-4 bg-stone-900/80 backdrop-blur-sm text-stone-200 text-xs font-bold px-3 py-1.5 rounded-sm z-10 pointer-events-none uppercase tracking-widest shadow-sm">Hal {page}</div>
              <img 
                src={getPageImageUrl(skripsi.linkPDF, page)} 
                alt={`Halaman ${page}`}
                className="w-full h-auto object-contain pointer-events-none"
                draggable="false"
                onError={(e) => { 
                  e.target.style.display = 'none'; 
                  e.target.parentElement.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-20 text-center text-stone-500 text-sm font-lora border-t border-stone-800 pt-8 pb-12 relative z-40 bg-[#1c1917]">
          <p className="mb-2 text-amber-500 font-bold uppercase tracking-widest text-xs">Batas Pratinjau Tercapai</p>
          <p className="mb-2">Anda telah mencapai batas halaman yang diizinkan untuk pratinjau.</p>
          <p className="text-stone-600 text-xs max-w-lg mx-auto leading-relaxed mt-4">
            Dokumen ini dilindungi oleh watermark dinamis. Dilarang menyalin, merekam layar, atau menyebarkan dokumen ini tanpa izin tertulis dari pengurus Asrama Merapi Singgalang.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function SecureViewerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1c1917] text-stone-300 flex items-center justify-center font-lora text-lg">Menyiapkan Ruang Baca Rahasia...</div>}>
      <SecureViewerContent />
    </Suspense>
  );
}
