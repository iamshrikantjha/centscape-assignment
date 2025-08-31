import * as SQLite from "expo-sqlite";

export interface WishlistItem {
  id: string;
  title: string;
  image?: string;
  price?: string;
  currency?: string;
  siteName: string;
  sourceUrl: string;
  normalizedUrl: string;
  createdAt: string;
}

export interface AddWishlistItemData {
  title: string;
  image?: string;
  price?: string;
  currency?: string;
  siteName: string;
  sourceUrl: string;
  normalizedUrl: string;
}

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase;
  private static readonly DB_NAME = "wishlist.db";
  private static readonly CURRENT_VERSION = 2;

  static async initializeDatabase() {
    try {
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
      await this.createTables();
      await this.migrateDatabase();
      console.log("✅ Database initialized successfully");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw error;
    }
  }

  private static async createTables() {
    // Create initial table (v1 schema: no normalizedUrl)
    await this.db.execAsync(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      image TEXT,
      price TEXT,
      currency TEXT,
      siteName TEXT NOT NULL,
      sourceUrl TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

    // Schema version table
    await this.db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

    // Ensure version row exists
    const versionRow = await this.db.getFirstAsync<{ version: number }>(
      "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1"
    );
    if (!versionRow) {
      await this.db.runAsync(
        "INSERT INTO schema_version (version) VALUES (?)",
        [1] // start at v1
      );
    }
  }

  private static async migrateDatabase() {
    const currentVersion = await this.getCurrentSchemaVersion();

    if (currentVersion < 2) {
      console.log("🔄 Migrating database from v1 to v2...");
      await this.migrateToV2();
      await this.setSchemaVersion(2);
      console.log("✅ Database migration completed");
    }
  }

  private static async getCurrentSchemaVersion(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ version: number }>(
        "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1"
      );
      return result?.version || 1;
    } catch {
      // Table doesn't exist, this is v1
      return 1;
    }
  }

  private static async setSchemaVersion(version: number) {
    await this.db.runAsync(
      "INSERT OR REPLACE INTO schema_version (version) VALUES (?)",
      [version]
    );
  }

  private static async migrateToV2() {
    try {
      // Add normalizedUrl column if it doesn’t exist
      await this.db.execAsync(`
      ALTER TABLE wishlist_items ADD COLUMN normalizedUrl TEXT;
    `);

      // Backfill data
      const existingItems = await this.db.getAllAsync<{
        id: string;
        sourceUrl: string;
      }>(
        "SELECT id, sourceUrl FROM wishlist_items WHERE normalizedUrl IS NULL"
      );

      for (const item of existingItems) {
        const normalizedUrl = this.normalizeUrl(item.sourceUrl);
        await this.db.runAsync(
          "UPDATE wishlist_items SET normalizedUrl = ? WHERE id = ?",
          [normalizedUrl, item.id]
        );
      }

      // Now create index (column exists!)
      await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_normalized_url ON wishlist_items(normalizedUrl);
    `);
      await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_created_at ON wishlist_items(createdAt DESC);
    `);
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  static async addWishlistItem(data: AddWishlistItemData): Promise<void> {
    const id = this.generateId();
    const createdAt = new Date().toISOString();

    await this.db.runAsync(
      `
      INSERT INTO wishlist_items (
        id, title, image, price, currency, siteName, sourceUrl, normalizedUrl, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        data.title,
        data.image || null,
        data.price || null,
        data.currency || null,
        data.siteName,
        data.sourceUrl,
        data.normalizedUrl,
        createdAt,
      ]
    );
  }

  static async getWishlistItems(): Promise<WishlistItem[]> {
    const items = await this.db.getAllAsync<WishlistItem>(
      "SELECT * FROM wishlist_items ORDER BY createdAt DESC"
    );
    return items;
  }

  static async deleteWishlistItem(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM wishlist_items WHERE id = ?", [id]);
  }

  static async findItemByNormalizedUrl(
    normalizedUrl: string
  ): Promise<WishlistItem | null> {
    const item = await this.db.getFirstAsync<WishlistItem>(
      "SELECT * FROM wishlist_items WHERE normalizedUrl = ?",
      [normalizedUrl]
    );
    return item || null;
  }

  static async clearAllItems(): Promise<void> {
    await this.db.runAsync("DELETE FROM wishlist_items");
  }

  static async getItemCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM wishlist_items"
    );
    return result?.count || 0;
  }

  static normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);

      // Remove UTM parameters and other tracking params
      const paramsToRemove = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "gclid",
        "fbclid",
        "msclkid",
        "ref",
        "tag",
        "_ga",
        "mc_cid",
        "mc_eid",
      ];

      paramsToRemove.forEach((param) => {
        parsed.searchParams.delete(param);
      });

      // Remove fragment (everything after #)
      parsed.hash = "";

      // Lowercase hostname
      parsed.hostname = parsed.hostname.toLowerCase();

      // Remove trailing slash if no path
      if (parsed.pathname === "/") {
        parsed.pathname = "";
      }

      return parsed.toString();
    } catch {
      // If URL parsing fails, just return lowercase version
      return url.toLowerCase();
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
