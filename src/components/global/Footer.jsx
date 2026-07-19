import Link from 'next/link';
import { Instagram, MapPin, Mail } from 'lucide-react';

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
              <Instagram size={20} />
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