const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// CORRECT DB PATH from db.js: path.resolve(__dirname, '../database/crm.sqlite');
// Relative to CWD (d:/antigravity): server/../database/crm.sqlite -> database/crm.sqlite
const dbPath = path.resolve('database/crm.sqlite');
console.log("Using DB Path:", dbPath);

const db = new sqlite3.Database(dbPath);

console.log("Checking users...");
db.all("SELECT id, name, email, role, login FROM users", [], (err, rows) => {
    if (err) {
        console.error("Error querying users:", err);
        return;
    }
    console.log("Users found:", rows);
});
