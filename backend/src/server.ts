import env from './config/env';
import app from './app';

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`
======================================================
  MiniLedger Backend Server Started Successfully
  Listening on: http://localhost:${env.PORT}
  Environment:  ${env.NODE_ENV}
  Database:     Connected to PostgreSQL via Prisma
======================================================
  `);
});

// Graceful shutdown
const handleShutdown = () => {
  console.log('\nShutting down server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
