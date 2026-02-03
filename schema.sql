-- 1. Pipelines e Estágios
CREATE TABLE IF NOT EXISTS pipelines (
    id SERIAL PRIMARY KEY, 
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stages (
    id SERIAL PRIMARY KEY, 
    pipeline_id INTEGER REFERENCES pipelines(id), 
    name TEXT NOT NULL, 
    "order" INTEGER DEFAULT 0
);

-- 2. Clientes e Usuários
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY, 
    name TEXT NOT NULL, 
    nationality TEXT, 
    marital_status TEXT, 
    profession TEXT, 
    rg TEXT, 
    cpf TEXT, 
    address TEXT, 
    phone TEXT, 
    email TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    street TEXT, 
    number TEXT, 
    neighborhood TEXT, 
    city TEXT, 
    state TEXT, 
    zip TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, 
    name TEXT NOT NULL, 
    email TEXT NOT NULL UNIQUE, 
    cpf TEXT, 
    phone TEXT, 
    login TEXT UNIQUE, 
    role TEXT DEFAULT 'collaborator', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    password TEXT, 
    oab TEXT, 
    oab_uf TEXT, 
    office_address TEXT, 
    nationality TEXT, 
    marital_status TEXT
);

-- 3. Negócios (Processos)
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY, 
    title TEXT NOT NULL, 
    client_name TEXT, 
    client_id INTEGER REFERENCES clients(id), 
    value REAL, 
    stage_id INTEGER REFERENCES stages(id), 
    description TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    deadline DATE, 
    priority TEXT DEFAULT 'Normal', 
    responsible_id INTEGER REFERENCES users(id), 
    delegated_to_id INTEGER REFERENCES users(id), 
    folder_path TEXT, 
    process_number TEXT
);

-- 4. Configurações e Arquivos
CREATE TABLE IF NOT EXISTS office_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), 
    company_name TEXT, 
    cnpj TEXT, 
    oab_company TEXT, 
    address TEXT, 
    attorney_name TEXT, 
    oab_attorney TEXT, 
    attorney_qualification TEXT, 
    zapsign_token TEXT, 
    datajud_url TEXT, 
    datajud_key TEXT
);

CREATE TABLE IF NOT EXISTS deal_comments (
    id SERIAL PRIMARY KEY, 
    deal_id INTEGER REFERENCES deals(id), 
    user_id INTEGER REFERENCES users(id), 
    user_name TEXT, 
    content TEXT NOT NULL, 
    type TEXT DEFAULT 'general', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_documents (
    id SERIAL PRIMARY KEY, 
    client_id INTEGER REFERENCES clients(id), 
    type TEXT, 
    title TEXT, 
    filename TEXT, 
    path TEXT, 
    created_by INTEGER REFERENCES users(id), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    external_id TEXT, 
    signer_link TEXT, 
    status TEXT DEFAULT 'created', 
    description TEXT
);

CREATE TABLE IF NOT EXISTS deal_files (
    id SERIAL PRIMARY KEY, 
    deal_id INTEGER REFERENCES deals(id), 
    filename TEXT, 
    path TEXT, 
    uploaded_by INTEGER REFERENCES users(id), 
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publications (
    id SERIAL PRIMARY KEY, 
    external_id TEXT UNIQUE, 
    content TEXT, 
    process_number TEXT, 
    publication_date DATE, 
    court TEXT, 
    status TEXT DEFAULT 'new', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. DADOS INICIAIS (SEED) --

-- Inserir Pipeline Padrão
INSERT INTO pipelines (name) VALUES ('Pipeline Padrão');

-- Inserir Estágios (pegando o ID do ultimo pipeline criado, que deve ser 1)
INSERT INTO stages (pipeline_id, name, "order") VALUES 
(1, 'Nova Atividade', 0),
(1, 'Em Execução', 1),
(1, 'Aguardando Cliente', 2),
(1, 'Aguardando Ajuizamento', 3),
(1, 'Concluído', 4);

-- Inserir Usuário Admin (Senha: 123456)
INSERT INTO users (name, email, login, role, password)
VALUES ('Admin', 'admin@law.com', 'admin', 'admin', '$2a$10$wOq2c.y8xJ1.Z6.Z6.Z6.u7kZ9.Z6.Z6.Z6.Z6.Z6');
