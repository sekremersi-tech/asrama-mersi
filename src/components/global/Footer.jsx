"use client";

import Link from 'next/link';
import { MapPin, Mail } from 'lucide-react';
// ... (kode lainnya biarkan saja)
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Info Asrama */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Merapi Singgalang</h3>
            <p className="text-sm leading-relaxed mb-4">
              Etalase prestasi dan repositori intelektual warga Asrama Mahasiswa Merapi Singgalang. Mengedepankan nilai kekeluargaan dan semangat perantau Minangkabau.
            </p>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Hubungi Kami</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-red-500 shrink-0 mt-0.5" />
                <span>Yogyakarta, Daerah Istimewa Yogyakarta, Indonesia</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-red-500 shrink-0" />
                <span>kontak@merapisinggalang.com</span>
              </li>
            </ul>
          </div>

          {/* Sosial Media */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Sosial Media</h3>
            <a 
              href="https://www.instagram.com/asramamerapisinggalang/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-white transition-colors w-fit"
            >
              {/* Ikon Instagram diganti dengan SVG langsung */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
              </svg>
              <span>@asramamerapisinggalang</span>
            </a>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex justify-between items-center text-xs">
          <p>
            &copy; {new Date().getFullYear()} Asrama Mahasiswa Merapi Singgalang
            {/* Tautan Admin Tersembunyi pada titik ini */}
            <Link href="/admin/login" className="cursor-default text-slate-900 hover:text-red-500 transition-colors">.</Link>
          </p>
          <p>Dikelola oleh Pengurus Asrama</p>
        </div>
      </div>
    </footer>
  );
}
