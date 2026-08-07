-- Velantra database schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS farmers (
    id              SERIAL PRIMARY KEY,
    phone           VARCHAR(15) UNIQUE NOT NULL,
    email           VARCHAR(255),
    password_hash   TEXT NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    village         VARCHAR(255),
    district        VARCHAR(255),
    state           VARCHAR(255),
    pin_code        VARCHAR(10),
    farm_size       NUMERIC(10,2),
    main_crops      TEXT,
    bank_account    VARCHAR(50),
    ifsc            VARCHAR(20),
    upi_id          VARCHAR(100),
    aadhaar_id      VARCHAR(20),
    kyc_status      VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending','verified','rejected')),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
    id                  SERIAL PRIMARY KEY,
    farmer_id           INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_name           VARCHAR(100) NOT NULL,
    quantity            NUMERIC(10,2) NOT NULL,
    unit                VARCHAR(20) DEFAULT 'kg',
    location            VARCHAR(255),
    expected_price      NUMERIC(10,2) NOT NULL,
    ai_suggested_price  NUMERIC(10,2),
    harvest_date        DATE,
    crop_quality        VARCHAR(50),
    status              VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','paused','sold')),
    views               INTEGER DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT now(),
    expires_at          DATE
);
CREATE INDEX IF NOT EXISTS idx_listings_farmer_id ON listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

CREATE TABLE IF NOT EXISTS buyer_requests (
    id                  SERIAL PRIMARY KEY,
    listing_id          INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id            INTEGER NOT NULL,
    offered_price       NUMERIC(10,2) NOT NULL,
    quantity_requested  NUMERIC(10,2) NOT NULL,
    delivery_location   VARCHAR(255),
    status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
    created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_listing_id ON buyer_requests(listing_id);

CREATE TABLE IF NOT EXISTS orders (
    id                  SERIAL PRIMARY KEY,
    buyer_request_id    INTEGER REFERENCES buyer_requests(id),
    farmer_id           INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    buyer_id            INTEGER NOT NULL,
    crop_name           VARCHAR(100),
    quantity            NUMERIC(10,2),
    agreed_price        NUMERIC(10,2),
    delivery_address    TEXT,
    delivery_date       DATE,
    order_status        VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending','delivered','completed','cancelled')),
    created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

CREATE TABLE IF NOT EXISTS escrow_records (
    id                  SERIAL PRIMARY KEY,
    order_id            INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    total_amount        NUMERIC(10,2) NOT NULL,
    status              VARCHAR(20) DEFAULT 'locked' CHECK (status IN ('locked','released','refunded')),
    blockchain_tx_id    VARCHAR(100),
    created_at          TIMESTAMPTZ DEFAULT now(),
    released_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_escrow_order_id ON escrow_records(order_id);

CREATE TABLE IF NOT EXISTS wallet (
    id                  SERIAL PRIMARY KEY,
    farmer_id           INTEGER NOT NULL UNIQUE REFERENCES farmers(id) ON DELETE CASCADE,
    total_earnings      NUMERIC(12,2) DEFAULT 0,
    pending_amount      NUMERIC(12,2) DEFAULT 0,
    completed_amount    NUMERIC(12,2) DEFAULT 0,
    last_withdrawal     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
    id                  SERIAL PRIMARY KEY,
    wallet_id           INTEGER NOT NULL REFERENCES wallet(id) ON DELETE CASCADE,
    amount              NUMERIC(12,2) NOT NULL,
    transaction_type     VARCHAR(10) CHECK (transaction_type IN ('credit','debit')),
    description         TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
