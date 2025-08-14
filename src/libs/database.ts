import { createClient } from '@vercel/postgres';

const client = createClient({
  connectionString: process.env.POSTGRES_URL,
});
await client.connect();
