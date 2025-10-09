import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 8080;
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
export const CORS_ORIGIN = (process.env.CORS_ORIGIN || '*').split(',');