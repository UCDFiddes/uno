import BetterSqlite3 from "better-sqlite3";
import { NAME_PARTS } from "config/CONSTANTS";

/**
 * Database manager for user data which has methods for retriving a list of users and updating their names and wins with a strong cache.
 */
export default class DatabaseManager {
  database: BetterSqlite3.Database;
  cache: Record<string, any>;

  constructor() {
    // Connect to the database stored as a file in the root of the project.
    this.database = new BetterSqlite3("database.db");
    this.cache = {};
    this.setup();
  }

  // Create the users table if it doesn't exist.
  setup() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        wins INTEGER DEFAULT 0
      );
    `);
  }

  // Generate a random name from the list of name parts.
  generateName() {
    return NAME_PARTS[Math.floor(Math.random() * NAME_PARTS.length)] + NAME_PARTS[Math.floor(Math.random() * NAME_PARTS.length)];
  }

  // Loops through the list of user_ids and retrieves the user data from the database, creating a new user if they don't exist saving to the cache.
  async getUsers(user_ids: string[]) {
    let users = [];

    for (let user_id of user_ids) {
      if (!this.cache[user_id]) this.cache[user_id] = await this.database.prepare("SELECT * FROM users WHERE id = ?").get(user_id);
      if (!this.cache[user_id]) {
        const name = this.generateName();
        await this.database.prepare("INSERT INTO users (id, name, wins) VALUES (?, ?, ?)").run(user_id, name, 0);
        this.cache[user_id] = { id: user_id, name, wins: 0 };
      }
      users.push(this.cache[user_id]);
    }

    return users;
  }

  // Update the name of a user in the database and cache.
  async updateName(user_id: string, name: string) {
    await this.database.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, user_id);
    this.cache[user_id].name = name;
  }

  // Increment the wins of a user in the database and cache.
  async incrementWins(user_id: string) {
    await this.database.prepare("UPDATE users SET wins = wins + 1 WHERE id = ?").run(user_id);
    this.cache[user_id].wins++;
  }
}
