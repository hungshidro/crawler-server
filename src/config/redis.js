import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redis = null;

// Khoi tao Redis client
export const initRedis = () => {
  try {
    // Neu khong co REDIS_URL, chay trong che do no-cache
    if (!process.env.REDIS_URL) {
      console.log("⚠️  REDIS_URL not found - running without cache");
      return null;
    }

    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
        if (targetErrors.some((e) => err.message.includes(e))) {
          return true;
        }
        return false;
      },
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected");
    });

    redis.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
    });

    redis.on("reconnecting", () => {
      console.log("🔄 Redis reconnecting...");
    });

    return redis;
  } catch (error) {
    console.error("Failed to initialize Redis:", error.message);
    return null;
  }
};

// Helper functions voi fallback neu Redis khong available
export const getRedis = () => redis;

export const cacheGet = async (key) => {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (error) {
    console.error("Redis get error:", error.message);
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 3600) => {
  if (!redis) return false;
  try {
    await redis.set(key, value, "EX", ttlSeconds);
    return true;
  } catch (error) {
    console.error("Redis set error:", error.message);
    return false;
  }
};

export const cacheDel = async (key) => {
  if (!redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Redis del error:", error.message);
    return false;
  }
};

// Close connection (dung cho graceful shutdown)
export const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    console.log("Redis connection closed");
  }
};

export default { initRedis, getRedis, cacheGet, cacheSet, cacheDel, closeRedis };
