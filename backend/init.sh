#!/usr/bin/env bash

set -e

echo "Populating dev DB with sample data..."

source .env

psql -v ON_ERROR_STOP=1 "postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" <<-EOSQL

-- Create sample publication
INSERT INTO publs (id, type, author, year, name, external, language, resume, ural, coords, occs, spec, pdf_file)
VALUES (
    1,
    'A',
    'Сидоров И.И.',
    2000,
    'Сидоров о паукообразных',
    'Альтернативное название',
    'rus',
    'eng',
    true,
    true,
    true,
    true,
    'sidorov.pdf'
) ON CONFLICT (id) DO NOTHING;

-- Create sample user
INSERT INTO users (user_id, name, hash, hash_date, reg_stat, age, lng, rating, publ_id, items, reg_run, reg_end)
VALUES (
    ${DEV_TG_ID:=1},
    'DEV_USERNAME',
    '\$argon2id\$v=19\$m=65536,t=3,p=4\$00Bvw6eX2A/AYNF+x0lPoQ\$gjqsv9RV5cY2RKSZU3RYy3PUy0BarKObCOKsV3AA4FA',
    NOW(),
    1,
    20,
    'all',
    1,
    1,
    '1',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

EOSQL

echo "Sample data created successfully."
