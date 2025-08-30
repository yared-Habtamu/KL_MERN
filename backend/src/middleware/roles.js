// Centralized role-based access middleware
export const requireOperator = (req, res, next) => {
  if (req.user && req.user.role === 'operator') return next();
  return res.status(403).json({ message: 'Operator access only' });
};

export const requireAdminOrManager = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
    return res.status(403).json({ message: 'Forbidden: Admin or Manager only' });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access only' });
};

export const requireManager = (req, res, next) => {
  if (req.user && req.user.role === 'manager') return next();
  return res.status(403).json({ message: 'Manager access only' });
};

export const requireSeller = (req, res, next) => {
  if (req.user && req.user.role === 'seller') return next();
  return res.status(403).json({ message: 'Seller access only' });
}; 