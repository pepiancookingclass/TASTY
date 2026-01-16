import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configurar directorio raíz para evitar warnings de lockfiles múltiples
  outputFileTracingRoot: __dirname,
  // Deshabilitar analytics automáticos de Vercel en desarrollo
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config: any) => {
      // Evitar cargar scripts de Vercel en desarrollo
      config.resolve.alias = {
        ...config.resolve.alias,
        '@vercel/analytics/react': false,
        '@vercel/speed-insights/next': false,
      };
      return config;
    },
  }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'aitmxnfljglwpkpibgek.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
