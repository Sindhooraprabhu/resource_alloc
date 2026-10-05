module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink_ai',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  AI_PROVIDER: process.env.AI_PROVIDER || 'none',
  AI_MODEL: process.env.AI_MODEL || 'gemini-2.5-flash-lite',
  AI_API_KEY: process.env.AI_API_KEY || '',
  ROUTING_PROVIDER: process.env.ROUTING_PROVIDER || 'osrm',
  ROUTING_BASE_URL: process.env.ROUTING_BASE_URL || 'https://router.project-osrm.org'
};