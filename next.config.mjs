/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next dev` e `next build` em pastas separadas: um build rodado com o servidor de
  // desenvolvimento aberto sobrescrevia .next e quebrava a página (chunks 404/503).
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
