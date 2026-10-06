import type postgres from "postgres";
import { getSql, isPersistent as dbIsPersistent } from "@/lib/server/postgres";
import {
  DEFAULT_PAGE_SIZE,
  GuestbookMessage,
  GuestbookAvatar,
  MAX_PAGE_SIZE,
  UserStatus,
  nickColorIndex,
} from "./types";

type NewMessage = {
  nick: string;
  body: string;
  avatar: GuestbookAvatar;
  status: UserStatus;
  ipHash?: string | null;
};

type Store = {
  add: (message: NewMessage) => Promise<GuestbookMessage>;
  list: (options?: { limit?: number; before?: number }) => Promise<GuestbookMessage[]>;
  count: () => Promise<number>;
  remove: (id: number) => Promise<boolean>;
  existingIds: (ids: number[]) => Promise<number[]>;
};

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) return DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(limit)));
}

// ── Postgres store ────────────────────────────────────────────────────────
let schemaReady: Promise<void> | null = null;

function ensureSchema(client: postgres.Sql): Promise<void> {
  if (process.env.FLOPPYY_DISABLE_RUNTIME_SCHEMA_SYNC === "1") return Promise.resolve();
  if (!schemaReady) {
    schemaReady = (async () => {
      await client`
        CREATE TABLE IF NOT EXISTS guestbook_messages (
          id BIGSERIAL PRIMARY KEY,
          nick TEXT NOT NULL,
          body TEXT NOT NULL,
          avatar TEXT NOT NULL DEFAULT 'face-smile',
          color SMALLINT NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'online',
          ip_hash TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await client`
        ALTER TABLE guestbook_messages
        ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT 'face-smile'
      `;
      await client`
        CREATE INDEX IF NOT EXISTS guestbook_messages_id_desc_idx
        ON guestbook_messages (id DESC)
      `;
    })().catch((error) => {
      // Don't cache a rejected promise — allow a retry once the DB is reachable.
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

type Row = {
  id: string | number;
  nick: string;
  body: string;
  avatar?: string | null;
  color: number;
  status: string;
  created_at: Date | string;
};

function rowToMessage(row: Row): GuestbookMessage {
  return {
    id: Number(row.id),
    nick: row.nick,
    body: row.body,
    avatar: (row.avatar ?? "face-smile") as GuestbookAvatar,
    color: Number(row.color),
    status: row.status as UserStatus,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

const postgresStore: Store = {
  async existingIds(ids) {
    if (!ids.length) return [];
    const client = getSql();
    if (!client) throw new Error("Postgres not configured");
    await ensureSchema(client);
    const rows = await client<{ id: string }[]>`SELECT id FROM guestbook_messages WHERE id IN ${client(ids)}`;
    return rows.map((row) => Number(row.id));
  },
  async add(message) {
    const client = getSql();
    if (!client) throw new Error("Postgres not configured");
    await ensureSchema(client);
    const color = nickColorIndex(message.nick);
    const [row] = await client<Row[]>`
      INSERT INTO guestbook_messages ${client({
        nick: message.nick,
        body: message.body,
        avatar: message.avatar,
        color,
        status: message.status,
        ip_hash: message.ipHash ?? null,
      })}
      RETURNING id, nick, body, avatar, color, status, created_at
    `;
    return rowToMessage(row);
  },

  async list(options) {
    const client = getSql();
    if (!client) throw new Error("Postgres not configured");
    await ensureSchema(client);
    const limit = clampLimit(options?.limit);
    const before = options?.before;
    const rows = before
      ? await client<Row[]>`
          SELECT id, nick, body, avatar, color, status, created_at
          FROM guestbook_messages
          WHERE id < ${before}
          ORDER BY id DESC
          LIMIT ${limit}
        `
      : await client<Row[]>`
          SELECT id, nick, body, avatar, color, status, created_at
          FROM guestbook_messages
          ORDER BY id DESC
          LIMIT ${limit}
        `;
    return rows.map(rowToMessage).reverse();
  },

  async count() {
    const client = getSql();
    if (!client) throw new Error("Postgres not configured");
    await ensureSchema(client);
    const [row] = await client<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM guestbook_messages
    `;
    return Number(row?.count ?? 0);
  },

  async remove(id) {
    const client = getSql();
    if (!client) throw new Error("Postgres not configured");
    await ensureSchema(client);
    const rows = await client<{ id: string }[]>`
      DELETE FROM guestbook_messages WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  },
};

// ── In-memory fallback (local dev without DATABASE_URL) ─────────────────────
const memory: GuestbookMessage[] = [];
let memoryId = 0;

const memoryStore: Store = {
  async existingIds(ids) {
    const wanted = new Set(ids);
    return memory.filter((message) => wanted.has(message.id)).map((message) => message.id);
  },
  async add(message) {
    memoryId += 1;
    const entry: GuestbookMessage = {
      id: memoryId,
      nick: message.nick,
      body: message.body,
      avatar: message.avatar,
      color: nickColorIndex(message.nick),
      status: message.status,
      createdAt: new Date().toISOString(),
    };
    memory.push(entry);
    if (memory.length > 500) memory.splice(0, memory.length - 500);
    return entry;
  },

  async list(options) {
    const limit = clampLimit(options?.limit);
    const before = options?.before;
    const source = before ? memory.filter((m) => m.id < before) : memory;
    return source.slice(-limit);
  },

  async count() {
    return memory.length;
  },

  async remove(id) {
    const index = memory.findIndex((m) => m.id === id);
    if (index === -1) return false;
    memory.splice(index, 1);
    return true;
  },
};

export function guestbookStore(): Store {
  return process.env.DATABASE_URL ? postgresStore : memoryStore;
}

export function isPersistent(): boolean {
  return dbIsPersistent();
}
