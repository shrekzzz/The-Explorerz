import nodemailer from 'nodemailer';
import { env } from './env.js';

export const emailTransport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  // Add timeouts to prevent hanging
  connectionTimeout: 10000, // 10 seconds to establish connection
  greetingTimeout: 5000,    // 5 seconds for greeting
  socketTimeout: 15000,     // 15 seconds for socket inactivity
  // Pool connections for better performance
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

export const emailDefaults = {
  from: `"DeshYatra" <${env.EMAIL_FROM}>`,
};
