const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Try ./database.sqlite relative to CWD if index.js does that, or relative to server dir
const dbPath = path.resolve('server/database.sqlite');
console.log("Using DB Path:", dbPath);

const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Tables found:", rows);
});
