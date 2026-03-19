import { redis } from "../redis";

class RedisUtil {

  async set(key: string, value: unknown, ttl: number = 300): Promise<void> {
    await redis.setEx(key, ttl, JSON.stringify(value));
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async del(key: string): Promise<void> {
    await redis.del(key);
  }

  async incr(key: string): Promise<number> {
    return await redis.incr(key);
  }

  async incrBy(key: string, value: number): Promise<number> {
    return await redis.incrBy(key, value);
  }

  async decr(key: string): Promise<number> {
    return await redis.decr(key);
  }

  async decrBy(key: string, value: number): Promise<number> {
    return await redis.decrBy(key, value);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await redis.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await redis.ttl(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    let cursor = "0";
    do {
      const result = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      if (result.keys.length > 0) {
        await redis.del(result.keys);
      }
    } while (cursor !== "0");
  }
}

export default new RedisUtil();
