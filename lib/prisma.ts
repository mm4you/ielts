import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
config();

function getIpv4ConnectionStringSync(url: string | undefined): string | undefined {
  if (!url || process.env.VERCEL === '1') return url;
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^/?#]+)(.*)/);
  if (!match) return url;
  const hostAndPort = match[3];
  const [host, port] = hostAndPort.split(':');
  
  if (/^[0-9.]+$/.test(host)) return url;
  
  try {
    const cmd = `getent ahosts ${host} | grep -E '^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+' | head -n 1`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (output) {
      const ipv4Host = output.split(/\s+/)[0];
      const newHostAndPort = port ? `${ipv4Host}:${port}` : ipv4Host;
      let replaced = url.replace(hostAndPort, newHostAndPort);
      replaced = replaced.replace('channel_binding=require', 'channel_binding=disable');
      const endpointIdMatch = host.match(/^([a-z0-9-]+)-pooler/);
      if (endpointIdMatch) {
        const endpointId = endpointIdMatch[1];
        if (replaced.includes('?')) {
          replaced += `&options=project%3D${endpointId}`;
        } else {
          replaced += `?options=project%3D${endpointId}`;
        }
      }
      return replaced;
    }
  } catch (err) {
    // Silently ignore DNS resolution error to fallback
  }
  return url;
}

const originalUrl = process.env.DATABASE_URL;
const resolvedUrl = getIpv4ConnectionStringSync(originalUrl);

const basePrisma = new PrismaClient({
  datasources: {
    db: {
      url: resolvedUrl,
    },
  },
});

const globalForPrisma = globalThis as unknown as {
  prismaInstance: any | undefined;
};

export const prisma = globalForPrisma.prismaInstance ?? basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query, ...rest }) {
        const params = rest as any;
        const isScript = process.env.IS_SCRIPT === 'true';
        const transaction = params.__internalParams.transaction;

        if (isScript) {
          if (transaction) {
            const txClient = (basePrisma as any)._createItxClient(transaction);
            return txClient[model][operation](args);
          }
          const [, result] = await basePrisma.$transaction([
            basePrisma.$executeRaw`SELECT set_config('app.bypass_rls', 'true', true)`,
            query(args),
          ]);
          return result;
        }

        let userId = process.env.MOCK_USER_ID || '';
        if (!userId) {
          try {
            const authModule = await import('@/auth');
            const session = await authModule.auth();
            userId = session?.user?.id || '';
          } catch (e) {
            // No active request context or build time
          }
        }

        if (transaction) {
          const txClient = (basePrisma as any)._createItxClient(transaction);
          return txClient[model][operation](args);
        }

        const [, result] = await basePrisma.$transaction([
          basePrisma.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`,
          query(args),
        ]);
        return result;
      },
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaInstance = prisma;
}