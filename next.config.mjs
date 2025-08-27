/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            /** @type {import('next').NextConfig} */

              experimental: {
                serverActions: {
                  bodySizeLimit: '10mb',
                },
              },
              images: {
                remotePatterns: [
                  {
                    protocol: 'https',
                    hostname: 'uzippzfxkhteeajhcppp.supabase.co',
                    port: '',
                    pathname: '/storage/v1/object/public/**',
                  },
            
            {    
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'uzippzfxkhteeajhcppp.supabase.co',
            }
        ]
    }
};

export default nextConfig;
