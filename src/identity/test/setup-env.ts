import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

const envTestPath = path.join(process.cwd(), '.env.test');

if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
}

const normalizedJwtSecret = process.env.JWT_SECRET?.trim();

if (!normalizedJwtSecret || normalizedJwtSecret.length < 16) {
  process.env.JWT_SECRET = 'test-jwt-secret-1234';
} else {
  process.env.JWT_SECRET = normalizedJwtSecret;
}
