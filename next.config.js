/** @type {import('next').NextConfig} */
const nextConfig = {
  // File uploads for job documents are written to /public/uploads at runtime.
  // On read-only hosting platforms (e.g. Vercel's default filesystem), point
  // UPLOAD_DIR (see .env.example) at a writable/persistent location instead.
};

module.exports = nextConfig;
