import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pg from 'pg';

import type { Env } from '../../config/env.js';

export type QueryParams = readonly unknown[];

/** Minimal query surface shared by the pool and a transaction client. */
export interface Queryable {
  query<T extends pg.QueryResultRow>(text: string, params?: QueryParams): Promise<T[]>;
  queryOne<T extends pg.QueryResultRow>(text: string, params?: QueryParams): Promise<T | null>;
}

/**
 * Thin wrapper over a node-postgres pool. All SQL in the project is plain, parameterised
 * (`$1, $2, ...`) and lives in `*.repository.ts` files, never in controllers or services.
 */
@Injectable()
export class DatabaseService implements Queryable, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: pg.Pool;

  constructor(config: ConfigService<Env, true>) {
    this.pool = new pg.Pool({
      connectionString: config.get('DATABASE_URL', { infer: true }),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    this.pool.on('error', (error) => {
      this.logger.error(`Unexpected error on idle client: ${error.message}`);
    });
  }

  async query<T extends pg.QueryResultRow>(text: string, params: QueryParams = []): Promise<T[]> {
    const result = await this.pool.query<T>(text, [...params]);
    return result.rows;
  }

  async queryOne<T extends pg.QueryResultRow>(
    text: string,
    params: QueryParams = [],
  ): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] ?? null;
  }

  /** Runs `work` in a single transaction; rolls back if it throws. */
  async transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    const tx: Queryable = {
      query: async <R extends pg.QueryResultRow>(text: string, params: QueryParams = []) =>
        (await client.query<R>(text, [...params])).rows,
      queryOne: async <R extends pg.QueryResultRow>(text: string, params: QueryParams = []) =>
        (await client.query<R>(text, [...params])).rows[0] ?? null,
    };

    try {
      await client.query('BEGIN');
      const result = await work(tx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /** Returns true when the database answers a trivial query. */
  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.warn(
        `Database ping failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
