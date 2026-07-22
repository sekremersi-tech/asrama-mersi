"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [mode, setMode] = useState(null); // null (pilih mode), 'inti' (Google), 'divisi' (Username)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/admin/dashboard");
    } catch (error) { alert("Gagal login: " + error.message); setLoading(false); }
  };

  const handleDivisiLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mengubah username menjadi email samaran untuk Firebase
      const emailFormated = `${username.toLowerCase()}@mersi.com`;
      await signInWithEmailAndPassword(auth, emailFormated, password);
      router.push("/admin/dashboard");
    } catch (error) { 
      alert("Username atau kata sandi salah!"); 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f8f6] p-4 font-lora">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl max-w-md w-full border border-[#e8e4db] text-center">
        <img src="/mersi.png" alt="Logo" className="w-20 h-20 mx-auto mb-6 drop-shadow-md" />
        <h1 className="text-3xl font-bold font-playfair text-stone-900 mb-2">Portal Admin</h1>
        <p className="text-stone-500 text-sm mb-8">Sistem Manajemen Informasi Asrama Mahasiswa Merapi Singgalang.</p>

        {mode === null && (
          <div className="flex flex-col gap-4 font-sans">
            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-stone-200 text-stone-700 hover:bg-stone-50 font-bold py-4 px-6 rounded-lg transition-all shadow-sm">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Login Pengurus Inti (Google)
            </button>
            <button onClick={() => setMode("divisi")} className="w-full flex items-center justify-center gap-3 bg-[#171412] text-white hover:bg-red-800 font-bold py-4 px-6 rounded-lg transition-all shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Login Divisi (Username)
            </button>
          </div>
        )}

        {mode === "divisi" && (
          <form onSubmit={handleDivisiLogin} className="space-y-4 font-sans text-left animate-[fadeIn_0.3s_ease-out]">
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-widest mb-1">Username Divisi</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-800 focus:outline-none" placeholder="Cth: humas / puki / perkap..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-widest mb-1">Kata Sandi</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-800 focus:outline-none" placeholder="Masukkan sandi..." />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#171412] text-white font-bold py-3.5 rounded-lg hover:bg-red-800 transition-colors mt-4">
              {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
            </button>
            <button type="button" onClick={() => setMode(null)} className="w-full text-stone-500 text-sm font-bold mt-4 hover:text-red-800 transition-colors">← Kembali ke Pilihan Login</button>
          </form>
        )}
      </div>
    </div>
  );
}
