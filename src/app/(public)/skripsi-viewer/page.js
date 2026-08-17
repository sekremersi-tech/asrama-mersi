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

  // Mencegah screenshot/rekam layar dengan memburamkan saat window tidak fokus
  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // Mencegah Print Screen (Terbatas pada browser desktop) dan kombinasi tombol
    const handleKeyDown = (e) => {
      // Tombol Print Screen biasa
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("Screenshot dinonaktifkan demi hak cipta.");
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 3000);
      }
      
      // Kombinasi tombol Windows + Shift + S (Snipping Tool di Windows)
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 3000);
      }
    };
    
    // Mencegah penyalinan dengan klik kanan atau Ctrl+C
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

  // Fungsi untuk mengubah link PDF Cloudinary menjadi JPG Halaman 1, 2, dan 3
  const getPageImageUrl = (pdfUrl, pageNumber) => {
    if (!pdfUrl) return "";
    // Hapus format attachment agar tidak terdownload
    let cleanUrl = pdfUrl.replace("fl_attachment/", "");
    // Ganti ekstensi .pdf menjadi .jpg
    cleanUrl = cleanUrl.replace(/\.pdf$/i, ".jpg");
    // Tambahkan parameter halaman (pg_1, pg_2, dst)
    return cleanUrl.replace("/upload/", `/upload/pg_${pageNumber}/`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#1c1917] text-stone-300 font-lora text-lg">Memuat Dokumen Rahasia...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#1c1917] text-red-500 font-bold font-lora text-xl">{error}</div>;

  return (
    <div 
      className="min-h-screen bg-[#1c1917] relative select-none"
      onContextMenu={(e) => e.preventDefault()} // Mencegah klik kanan
      style={{ 
        WebkitTouchCallout: "none", 
        WebkitUserSelect: "none", 
        userSelect: "none",
        pointerEvents: isBlurred ? "none" : "auto" 
      }} // Mencegah tahan gambar di HP dan drag
    >
      {/* Peringatan Saat Layar Tidak Fokus atau Terdeteksi Screenshot */}
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

      {/* Header Info - Disesuaikan dengan desain yang diminta (Minimalis) */}
      <div className="bg-[#1c1917] border-b border-[#292524] py-4 px-6 md:px-12 sticky top-0 z-40 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md gap-4">
        <div className="max-w-3xl">
          <h1 className="text-stone-200 font-bold font-playfair text-lg md:text-xl line-clamp-2 leading-snug mb-1">{skripsi.judul}</h1>
          <p className="text-amber-600/80 text-xs font-sans tracking-widest uppercase font-bold">Penulis: {skripsi.nama} ({skripsi.tahun})</p>
        </div>
        <div className="bg-[#450a0a] border border-[#7f1d1d] text-red-200 px-4 py-2 rounded-sm text-xs font-bold whitespace-nowrap shadow-sm shrink-0 uppercase tracking-wider">
          HANYA BACA (3 HALAMAN)
        </div>
      </div>

      {/* Area Dokumen dengan Watermark */}
      <div className={`relative max-w-4xl mx-auto py-12 px-4 transition-all duration-300 ${isBlurred ? 'blur-[10px] opacity-30 grayscale' : 'opacity-100'}`}>
        
        {/* WATERMARK BERJALAN YANG MEMENUHI LAYAR (Lebih rapat dan jelas) */}
        <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden opacity-[0.05] mix-blend-overlay">
          <div className="flex flex-wrap gap-8 rotate-[-35deg] scale-150 w-[250%] h-[250%] -translate-x-1/3 -translate-y-1/3">
            {Array.from({ length: 200 }).map((_, i) => (
              <span key={i} className="text-4xl font-black text-white uppercase tracking-widest whitespace-nowrap">
                DIBACA OLEH {namaPeminta} ({hpPeminta}) - HAK CIPTA MERSI - 
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
                  // Jika gambar gagal dimuat (misalnya bukan halaman 1-3)
                  e.target.style.display = 'none'; 
                  e.target.parentElement.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-20 text-center text-stone-500 text-sm font-lora border-t border-stone-800 pt-8 pb-12">
          <p className="mb-2">Anda telah mencapai batas halaman yang diizinkan untuk pratinjau.</p>
          <p className="font-bold text-stone-400">Dilarang keras menyalin, merekam layar, atau menyebarkan dokumen ini tanpa izin tertulis dari pengurus Asrama Merapi Singgalang.</p>
        </div>

      </div>
    </div>
  );
}

export default function SecureViewerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1c1917] text-stone-300 flex items-center justify-center font-lora text-lg">Memuat Ruang Baca Rahasia...</div>}>
      <SecureViewerContent />
    </Suspense>
  );
}
