require("dotenv").config();

const config = {
  server: process.env.DB_SERVER?.trim(),
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

if (
  !config.server ||
  !config.port ||
  !config.database ||
  !config.user ||
  !config.password
) {
  throw new Error("Missing required database configuration");
}

module.exports = config;
