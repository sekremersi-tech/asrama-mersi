// src/app/admin/login/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "SEKREMERSI123") {
      // Simpan sesi admin sederhana ke sessionStorage
      sessionStorage.setItem("adminMersiAuth", "true");
      router.push("/admin/dashboard");
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="flex flex-col items-center mb-8">
          <ShieldAlert className="text-red-500 w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold text-white tracking-widest font-serif">PORTAL ADMIN</h1>
          <p className="text-slate-400 text-sm mt-2">Hanya untuk Pengurus Asrama</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="password"
              placeholder="Masukkan Kode Rahasia..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-center tracking-widest"
              required
            />
            {error && <p className="text-red-500 text-sm mt-2 text-center">Kode otentikasi tidak valid!</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Akses Repositori
          </button>
        </form>
      </div>
    </div>
  );
}