-- =========================================================
-- 화장품 고객관리(CRM) - Supabase / PostgreSQL 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일을 먼저 실행하고,
-- 그 다음 seed.sql 을 실행하세요.
-- =========================================================

-- 기존 테이블 제거 (재설치 시)
DROP TABLE IF EXISTS campaign_targets CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. 사용자
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    brand_name  TEXT DEFAULT 'AmorePacific'
);

-- 2. 고객
CREATE TABLE customers (
    id          SERIAL PRIMARY KEY,
    customer_no TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    birth_date  TEXT,
    join_date   TEXT NOT NULL,
    skin_type   TEXT,
    region      TEXT,
    memo        TEXT,
    mileage     INTEGER DEFAULT 0
);

-- 3. 상품
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    price       INTEGER NOT NULL,
    description TEXT,
    stock       INTEGER DEFAULT 0,
    image_url   TEXT,
    link        TEXT
);

-- 4. 판매
CREATE TABLE sales (
    id             SERIAL PRIMARY KEY,
    date           TEXT NOT NULL,
    customer_id    INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    total_amount   INTEGER NOT NULL,
    used_mileage   INTEGER DEFAULT 0,
    discount_type  TEXT,
    discount_value INTEGER DEFAULT 0,
    payment_method TEXT DEFAULT '카드',
    memo           TEXT
);

-- 5. 판매 품목
CREATE TABLE sale_items (
    id         SERIAL PRIMARY KEY,
    sale_id    INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL
);

-- 6. 재구매 캠페인
CREATE TABLE campaigns (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    segment    TEXT NOT NULL,
    message    TEXT,
    created_at TEXT NOT NULL
);

-- 7. 캠페인 대상 고객
CREATE TABLE campaign_targets (
    id          SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    rec_product TEXT,
    contacted   BOOLEAN DEFAULT false,
    result      TEXT
);

-- 조회 성능용 인덱스
CREATE INDEX idx_campaign_targets_campaign ON campaign_targets(campaign_id);
CREATE INDEX idx_sales_date        ON sales(date);
CREATE INDEX idx_sales_customer    ON sales(customer_id);
CREATE INDEX idx_sale_items_sale   ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_customers_no      ON customers(customer_no);

-- 관리자 계정과 모든 데이터는 seed.sql 에서 삽입됩니다.
-- (seed.sql 을 실행하지 않아도 관리자 코드 '0000' 으로 로그인 가능)
