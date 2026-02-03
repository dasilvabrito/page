const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ensure database directory exists
const dbPath = path.resolve(__dirname, '../database/crm.sqlite');
const fs = require('fs');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Pipelines (e.g., "General", "Litigation")
        db.run(`CREATE TABLE IF NOT EXISTS pipelines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )`);

        // Stages (e.g., "Leads", "Discovery", "Trial")
        db.run(`CREATE TABLE IF NOT EXISTS stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pipeline_id INTEGER,
            name TEXT NOT NULL,
            "order" INTEGER DEFAULT 0,
            FOREIGN KEY(pipeline_id) REFERENCES pipelines(id)
        )`);

        // Clients
        db.run(`CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            nationality TEXT,
            marital_status TEXT,
            profession TEXT,
            rg TEXT,
            cpf TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Deals/Cases
        db.run(`CREATE TABLE IF NOT EXISTS deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            client_name TEXT,
            client_id INTEGER,
            value REAL,
            stage_id INTEGER,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stage_id) REFERENCES stages(id),
            FOREIGN KEY(client_id) REFERENCES clients(id)
        )`);

        // Office Settings (Single Row)
        db.run(`CREATE TABLE IF NOT EXISTS office_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            company_name TEXT,
            cnpj TEXT,
            oab_company TEXT,
            address TEXT,
            attorney_name TEXT,
            oab_attorney TEXT,
            attorney_qualification TEXT
        )`);

        // Users
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            cpf TEXT,
            phone TEXT,
            login TEXT UNIQUE,
            role TEXT DEFAULT 'collaborator',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add client_id if not exists (Deals)
        db.all("PRAGMA table_info(deals)", (err, rows) => {
            if (!err) {
                const hasClientId = rows.some(r => r.name === 'client_id');
                if (!hasClientId) {
                    console.log("Migrating: Adding client_id to deals table");
                    db.run("ALTER TABLE deals ADD COLUMN client_id INTEGER REFERENCES clients(id)");
                }
            }
        });

        // Migration: Add columns to users if not exists
        db.all("PRAGMA table_info(users)", (err, rows) => {
            if (!err) {
                const columns = rows.map(r => r.name);
                if (!columns.includes('cpf')) {
                    console.log("Migrating: Adding cpf to users");
                    db.run("ALTER TABLE users ADD COLUMN cpf TEXT");
                }
                if (!columns.includes('phone')) {
                    console.log("Migrating: Adding phone to users");
                    db.run("ALTER TABLE users ADD COLUMN phone TEXT");
                }
                if (!columns.includes('login')) {
                    console.log("Migrating: Adding login to users");
                    db.run("ALTER TABLE users ADD COLUMN login TEXT UNIQUE");
                }
                if (!columns.includes('password')) {
                    console.log("Migrating: Adding password to users");
                    db.run("ALTER TABLE users ADD COLUMN password TEXT");
                }
            }
        });

        // Migration: Add Task fields to deals
        db.all("PRAGMA table_info(deals)", (err, rows) => {
            if (!err) {
                const columns = rows.map(r => r.name);
                if (!columns.includes('deadline')) {
                    console.log("Migrating: Adding deadline to deals");
                    db.run("ALTER TABLE deals ADD COLUMN deadline DATE");
                }
                if (!columns.includes('priority')) {
                    console.log("Migrating: Adding priority to deals");
                    db.run("ALTER TABLE deals ADD COLUMN priority TEXT DEFAULT 'Normal'");
                }
                if (!columns.includes('responsible_id')) {
                    console.log("Migrating: Adding responsible_id to deals");
                    db.run("ALTER TABLE deals ADD COLUMN responsible_id INTEGER REFERENCES users(id)");
                }
                if (!columns.includes('delegated_to_id')) {
                    console.log("Migrating: Adding delegated_to_id to deals");
                    db.run("ALTER TABLE deals ADD COLUMN delegated_to_id INTEGER REFERENCES users(id)");
                }
            }
        });

        // Migration: Add Lawyer fields to users
        db.all("PRAGMA table_info(users)", (err, rows) => {
            if (!err) {
                const columns = rows.map(r => r.name);
                if (!columns.includes('oab')) {
                    console.log("Migrating: Adding oab to users");
                    db.run("ALTER TABLE users ADD COLUMN oab TEXT");
                }
                if (!columns.includes('oab_uf')) {
                    console.log("Migrating: Adding oab_uf to users");
                    db.run("ALTER TABLE users ADD COLUMN oab_uf TEXT");
                }
                if (!columns.includes('office_address')) {
                    console.log("Migrating: Adding office_address to users");
                    db.run("ALTER TABLE users ADD COLUMN office_address TEXT");
                }
                if (!columns.includes('nationality')) {
                    console.log("Migrating: Adding nationality to users");
                    db.run("ALTER TABLE users ADD COLUMN nationality TEXT");
                }
                if (!columns.includes('marital_status')) {
                    console.log("Migrating: Adding marital_status to users");
                    db.run("ALTER TABLE users ADD COLUMN marital_status TEXT");
                }
            }
        });

        // Comments Table
        db.run(`CREATE TABLE IF NOT EXISTS deal_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deal_id INTEGER,
            user_id INTEGER,
            content TEXT NOT NULL,
            type TEXT DEFAULT 'general',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(deal_id) REFERENCES deals(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Migration: Add user_name to deal_comments
        db.all("PRAGMA table_info(deal_comments)", (err, rows) => {
            if (!err) {
                const columns = rows.map(r => r.name);
                if (!columns.includes('user_name')) {
                    console.log("Migrating: Adding user_name to deal_comments");
                    db.run("ALTER TABLE deal_comments ADD COLUMN user_name TEXT");
                }
            }
        });

        // Seed default data if empty
        db.get("SELECT count(*) as count FROM pipelines", (err, row) => {
            if (row.count === 0) {
                console.log("Seeding default data...");
                db.run(`INSERT INTO pipelines (name) VALUES ('Pipeline Padrão')`, function (err) {
                    if (!err) {
                        const pipelineId = this.lastID;
                        const stages = ['Nova Atividade', 'Em Execução', 'Aguardando Cliente', 'Aguardando Ajuizamento', 'Concluído'];
                        const stmt = db.prepare(`INSERT INTO stages (pipeline_id, name, "order") VALUES (?, ?, ?)`);
                        stages.forEach((stage, index) => {
                            stmt.run(pipelineId, stage, index);
                        });
                        stmt.finalize();
                    }
                });
            }
        });
        // Client Documents (History)
        db.run(`CREATE TABLE IF NOT EXISTS client_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            type TEXT,
            title TEXT,
            filename TEXT,
            path TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(client_id) REFERENCES clients(id),
            FOREIGN KEY(created_by) REFERENCES users(id)
        )`);

        // Migration: Add individual address fields to clients
        db.all("PRAGMA table_info(clients)", (err, rows) => {
            if (!err) {
                const columns = rows.map(r => r.name);
                const newFields = [
                    { name: 'street', type: 'TEXT' },
                    { name: 'number', type: 'TEXT' },
                    { name: 'neighborhood', type: 'TEXT' },
                    { name: 'city', type: 'TEXT' },
                    { name: 'state', type: 'TEXT' },
                    { name: 'zip', type: 'TEXT' }
                ];

                newFields.forEach(field => {
                    if (!columns.includes(field.name)) {
                        console.log(`Migrating: Adding ${field.name} to clients`);
                        db.run(`ALTER TABLE clients ADD COLUMN ${field.name} ${field.type}`);
                    }
                });
            }
        });

        // Migration: Add ZapSign Token to Office Settings
        db.all("PRAGMA table_info(office_settings)", (err, rows) => {
            if (!err) {
                const columns = rows.map(r => r.name);
                if (!columns.includes('zapsign_token')) {
                    console.log("Migrating: Adding zapsign_token to office_settings");
                    db.run("ALTER TABLE office_settings ADD COLUMN zapsign_token TEXT");
                }
            }
        });

        // Migration: Add ZapSign fields to client_documents
        db.all("PRAGMA table_info(client_documents)", (err, rows) => {
            if (!err) {
                const columns = rows.map(r => r.name);
                if (!columns.includes('external_id')) { // ZapSign open_id or token
                    db.run("ALTER TABLE client_documents ADD COLUMN external_id TEXT");
                }
                if (!columns.includes('signer_link')) {
                    db.run("ALTER TABLE client_documents ADD COLUMN signer_link TEXT");
                }
                if (!columns.includes('status')) { // pending, signed
                    db.run("ALTER TABLE client_documents ADD COLUMN status TEXT DEFAULT 'created'");
                }
                if (!columns.includes('description')) {
                    console.log("Migrating: Adding description to client_documents");
                    db.run("ALTER TABLE client_documents ADD COLUMN description TEXT");
                }
            }
        });

        // Migration: Add Process Number to Deals (PJE Integration)
        db.all("PRAGMA table_info(deals)", (err, rows) => {
            if (!err) {
                const columns = rows.map(r => r.name);
                if (!columns.includes('process_number')) {
                    console.log("Migrating: Adding process_number to deals");
                    db.run("ALTER TABLE deals ADD COLUMN process_number TEXT");
                }
            }
        });

        // Migration: Add DataJud Config to Office Settings (PJE Integration)
        db.all("PRAGMA table_info(office_settings)", (err, rows) => {
            if (!err) {
                const columns = rows.map(r => r.name);
                if (!columns.includes('datajud_url')) {
                    console.log("Migrating: Adding datajud_url to office_settings");
                    db.run("ALTER TABLE office_settings ADD COLUMN datajud_url TEXT");
                }
                if (!columns.includes('datajud_key')) {
                    console.log("Migrating: Adding datajud_key to office_settings");
                    db.run("ALTER TABLE office_settings ADD COLUMN datajud_key TEXT");
                }
            }
        });

        // Publications Table (New Module)
        db.run(`CREATE TABLE IF NOT EXISTS publications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            external_id TEXT UNIQUE,
            content TEXT,
            process_number TEXT,
            publication_date DATE,
            court TEXT,
            status TEXT DEFAULT 'new', 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add external_id to publications if not exists
        db.all("PRAGMA table_info(publications)", (err, rows) => {
            if (!err) {
                const columns = rows.map(r => r.name);
                if (!columns.includes('external_id')) {
                    console.log("Migrating: Adding external_id to publications");
                    // We cannot add UNIQUE constraint directly in SQLite via ALTER TABLE
                    // We add the column, then create a unique index
                    db.serialize(() => {
                        db.run("ALTER TABLE publications ADD COLUMN external_id TEXT");
                        db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_publications_external_id ON publications(external_id)");
                    });
                } else {
                    // Ensure unique index exists (in case column exists but constraint doesn't)
                    db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_publications_external_id ON publications(external_id)");
                }

                // Also ensure correct date column name if I messed up earlier? No, I fixed JS.
            }
        });

    });
}

module.exports = db;
