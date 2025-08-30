import rateLimit from 'express-rate-limit';


// Rate limiter for login endpoint
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 login requests per windowMs
    message: { message: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  // Rate limiter for ticket selling endpoint
  export const ticketSellLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // limit each IP to 20 ticket sales per minute
    message: { message: 'Too many ticket sales from this IP. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  // Rate limiter for admin/moderator endpoints
  export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 admin actions per windowMs
    message: { message: 'Too many admin actions. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });