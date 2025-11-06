
import { mysqlDb, sqliteDb, hasBothDatabases } from './db';
import { products, orders, orderItems, stockMovements, stockStats, returns, returnItems, discountCodes } from '@shared/schema';

export class DatabaseSync {
  private syncInterval: NodeJS.Timeout | null = null;

  async syncFromMysqlToSqlite() {
    if (!hasBothDatabases || !mysqlDb || !sqliteDb) {
      return;
    }

    try {
      console.log('Starting sync from MySQL to SQLite...');

      // Sync products
      const mysqlProducts = await mysqlDb.select().from(products);
      for (const product of mysqlProducts) {
        await sqliteDb.insert(products).values(product)
          .onConflictDoUpdate({
            target: products.id,
            set: product
          });
      }

      // Sync orders
      const mysqlOrders = await mysqlDb.select().from(orders);
      for (const order of mysqlOrders) {
        await sqliteDb.insert(orders).values(order)
          .onConflictDoUpdate({
            target: orders.id,
            set: order
          });
      }

      // Sync order items
      const mysqlOrderItems = await mysqlDb.select().from(orderItems);
      for (const item of mysqlOrderItems) {
        await sqliteDb.insert(orderItems).values(item)
          .onConflictDoUpdate({
            target: orderItems.id,
            set: item
          });
      }

      // Sync stock movements
      const mysqlStockMovements = await mysqlDb.select().from(stockMovements);
      for (const movement of mysqlStockMovements) {
        await sqliteDb.insert(stockMovements).values(movement)
          .onConflictDoUpdate({
            target: stockMovements.id,
            set: movement
          });
      }

      // Sync stock stats
      const mysqlStockStats = await mysqlDb.select().from(stockStats);
      for (const stats of mysqlStockStats) {
        await sqliteDb.insert(stockStats).values(stats)
          .onConflictDoUpdate({
            target: stockStats.id,
            set: stats
          });
      }

      // Sync returns
      const mysqlReturns = await mysqlDb.select().from(returns);
      for (const returnData of mysqlReturns) {
        await sqliteDb.insert(returns).values(returnData)
          .onConflictDoUpdate({
            target: returns.id,
            set: returnData
          });
      }

      // Sync return items
      const mysqlReturnItems = await mysqlDb.select().from(returnItems);
      for (const item of mysqlReturnItems) {
        await sqliteDb.insert(returnItems).values(item)
          .onConflictDoUpdate({
            target: returnItems.id,
            set: item
          });
      }

      // Sync discount codes
      const mysqlDiscountCodes = await mysqlDb.select().from(discountCodes);
      for (const code of mysqlDiscountCodes) {
        await sqliteDb.insert(discountCodes).values(code)
          .onConflictDoUpdate({
            target: discountCodes.id,
            set: code
          });
      }

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  startPeriodicSync(intervalMinutes: number = 5) {
    if (!hasBothDatabases) {
      console.log('Both databases not available, skipping periodic sync');
      return;
    }

    console.log(`Starting periodic sync every ${intervalMinutes} minutes`);
    this.syncInterval = setInterval(() => {
      this.syncFromMysqlToSqlite();
    }, intervalMinutes * 60 * 1000);

    // Initial sync
    this.syncFromMysqlToSqlite();
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic sync stopped');
    }
  }
}

export const dbSync = new DatabaseSync();
