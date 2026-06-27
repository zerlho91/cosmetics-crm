// DB 연결 레이어
// - DATABASE_URL 이 있으면: PostgreSQL(Supabase) 사용 (운영/배포)
// - DATABASE_URL 이 없으면: 내장 임베디드 Postgres(pglite) 사용 (로컬 테스트, 시드 자동 로드)
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let ready;
let backend; // 'pg' | 'pglite'
let pool; // pg Pool
let lite; // pglite 인스턴스

async function ensure() {
  if (ready) return ready;
  ready = (async () => {
    const cs = process.env.DATABASE_URL;
    if (cs) {
      backend = 'pg';
      pool = globalThis.__crmPool || new pg.Pool({
        connectionString: cs,
        ssl: { rejectUnauthorized: false },
        max: 3,
      });
      globalThis.__crmPool = pool;
      console.log('[db] PostgreSQL(Supabase) 연결');
    } else {
      backend = 'pglite';
      if (globalThis.__crmLite) { lite = globalThis.__crmLite; return; }
      const { PGlite } = await import('@electric-sql/pglite');
      lite = new PGlite(); // in-memory
      const dir = path.resolve(__dirname, '..', 'supabase');
      await lite.exec(fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8'));
      try {
        await lite.exec(fs.readFileSync(path.join(dir, 'seed.sql'), 'utf8'));
      } catch (e) {
        console.warn('[db] seed 로드 건너뜀:', e.message);
      }
      globalThis.__crmLite = lite;
      console.log('[db] DATABASE_URL 미설정 → 내장 Postgres(pglite) 사용, 시드 데이터 로드 완료');
    }
  })();
  return ready;
}

export async function query(text, params = []) {
  await ensure();
  if (backend === 'pg') return (await pool.query(text, params)).rows;
  return (await lite.query(text, params)).rows;
}

export async function get(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export async function withTransaction(fn) {
  await ensure();
  if (backend === 'pg') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  // pglite: 단일 연결 트랜잭션 에뮬레이션
  const client = { query: (t, p) => lite.query(t, p) };
  try {
    await lite.exec('BEGIN');
    const result = await fn(client);
    await lite.exec('COMMIT');
    return result;
  } catch (e) {
    await lite.exec('ROLLBACK');
    throw e;
  }
}
