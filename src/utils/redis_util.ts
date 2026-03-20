import { redis } from "../redis";

class RedisUtil {

  async set(key: string, value: unknown, ttl: number = 300): Promise<void> {
    await redis.set(key, JSON.stringify(value), { ex: ttl });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    return await redis.get<T>(key);
  }

  async del(key: string): Promise<void> {
    await redis.del(key);
  }

  async incr(key: string): Promise<number> {
    return await redis.incr(key);
  }

  async incrBy(key: string, value: number): Promise<number> {
    return await redis.incrby(key, value);
  }

  async decr(key: string): Promise<number> {
    return await redis.decr(key);
  }

  async decrBy(key: string, value: number): Promise<number> {
    return await redis.decrby(key, value);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await redis.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await redis.ttl(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = Number(nextCursor);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== 0);
  }
}

export default new RedisUtil();
