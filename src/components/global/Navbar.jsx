"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: "Beranda", path: "/beranda" },
    { name: "Profil", path: "/profil" },
    { name: "Kehidupan Asrama", path: "/kehidupan" },
    { name: "Jaringan Alumni", path: "/alumni" },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo / Judul Asrama */}
          <div className="flex items-center">
            <Link href="/beranda" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                <Home className="text-white w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-xl text-slate-900 tracking-tight">
                Merapi Singgalang
              </span>
            </Link>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`${
                  pathname === item.path
                    ? "text-red-800 font-semibold border-b-2 border-red-800"
                    : "text-slate-600 hover:text-red-800"
                } px-1 py-5 text-sm transition-colors`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Tombol Hamburger Menu (Untuk Mobile) */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-red-800 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu Mobile */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg absolute w-full">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`${
                  pathname === item.path
                    ? "bg-red-50 text-red-800 font-semibold border-l-4 border-red-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-red-800 border-l-4 border-transparent"
                } block px-3 py-2 rounded-md text-base transition-all`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
