
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import * as mysqlSchema from '@shared/schema.mysql';
import * as sqliteSchema from '@shared/schema.sqlite';

const connectionString = process.env.DATABASE_URL || '';
const useMysql = connectionString && !connectionString.includes('file:');

let db: any;
let mysqlDb: any = null;
let sqliteDb: any = null;
let hasBothDatabases = false;

// Initialize SQLite with its schema
const sqliteConnection = new Database('./local.db');
sqliteDb = drizzleSqlite(sqliteConnection, { schema: sqliteSchema });

// Try to initialize MySQL with its schema
(async () => {
  if (useMysql) {
    try {
      const mysqlConnection = mysql.createPool(connectionString);
      // Test the connection before using it
      await mysqlConnection.query('SELECT 1');
      mysqlDb = drizzleMysql(mysqlConnection, { schema: mysqlSchema });
      hasBothDatabases = true;
      db = mysqlDb; // Use MySQL as primary when available
      console.log('Connected to MySQL (primary) and SQLite (backup)');
    } catch (error) {
      console.warn('MySQL connection failed, using SQLite only:', error);
      db = sqliteDb;
    }
  } else {
    console.log('Using SQLite database');
    db = sqliteDb;
  }
})();

// Initialize with SQLite by default
db = sqliteDb;

export { db, mysqlDb, sqliteDb, hasBothDatabases };
