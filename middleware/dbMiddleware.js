const sql = require("mssql");
const dbConfig = require("../config/database");

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.connectionRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async getPool() {
    try {
      if (!this.pool) {
        this.pool = await sql.connect(dbConfig);

        // Handle pool errors
        this.pool.on("error", async (err) => {
          console.error("SQL Pool Error:", err);
          await this.closePool();
        });
      }

      if (!this.pool.connected) {
        await this.pool.connect();
      }

      return this.pool;
    } catch (error) {
      console.error("Error getting database pool:", error);
      throw error;
    }
  }

  async closePool() {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
      }
    } catch (error) {
      console.error("Error closing pool:", error);
    }
  }
}

const dbConnection = new DatabaseConnection();

async function dbMiddleware(req, res, next) {
  req.sql = sql;

  try {
    const pool = await dbConnection.getPool();
    req.db = pool;

    req.executeQuery = async (query, params = {}) => {
      let retries = dbConnection.connectionRetries;

      while (retries > 0) {
        try {
          const request = pool.request();

          // Validate and sanitize parameters
          Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              request.input(key, value);
            }
          });

          return await request.query(query);
        } catch (error) {
          console.error(
            `Query execution error (${retries} retries left):`,
            error
          );

          if (error.code === "ECONNCLOSED" && retries > 1) {
            retries--;
            await new Promise((resolve) =>
              setTimeout(resolve, dbConnection.retryDelay)
            );
            await dbConnection.closePool();
            req.db = await dbConnection.getPool();
            continue;
          }

          throw error;
        }
      }
    };

    next();
  } catch (err) {
    console.error("Database middleware error:", err);
    res.status(500).json({
      error: "Database connection failed",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
}

module.exports = dbMiddleware;
