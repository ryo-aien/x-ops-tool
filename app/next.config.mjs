/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker環境(dev/stg)はstandalone、Vercel環境はundefined
  ...(process.env.DEPLOY_TARGET === "docker" ? { output: "standalone" } : {}),
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
