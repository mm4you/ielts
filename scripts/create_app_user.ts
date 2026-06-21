import { prisma } from '../lib/prisma';

async function main() {
  try {
    console.log('Attempting to create database user "ielts_app"...');
    // Drop role if exists (safe for re-running)
    try {
      await prisma.$executeRawUnsafe(`DROP ROLE IF EXISTS ielts_app;`);
    } catch (e) {
      console.log('Role drop skipped or failed:', e);
    }

    await prisma.$executeRawUnsafe(`CREATE ROLE ielts_app WITH LOGIN PASSWORD 'IeltsAppSecurePass123!';`);
    console.log('Role created successfully!');

    console.log('Granting privileges on schema public...');
    await prisma.$executeRawUnsafe(`GRANT CONNECT ON DATABASE neondb TO ielts_app;`);
    await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ielts_app;`);
    await prisma.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ielts_app;`);
    await prisma.$executeRawUnsafe(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ielts_app;`);
    
    // Default privileges for future tables
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ielts_app;`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ielts_app;`);

    console.log('All privileges granted successfully to ielts_app!');
  } catch (err) {
    console.error('Failed to set up app user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
