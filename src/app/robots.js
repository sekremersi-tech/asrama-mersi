export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/admin/dashboard/'], // Mencegah Google melacak halaman Admin
    },
    // GANTI DENGAN DOMAIN ANDA
    sitemap: 'https://asramamersi.netlify.app', 
  }
}
