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
INSERT INTO users (id, name, hash, hash_date, reg_stat, age, lng, rating, publ_id, items, reg_run, reg_end)
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
) ON CONFLICT (id) DO NOTHING;

-- Create sample records with valid, realistic data
INSERT INTO records (
    publ_id, user_id, datetime, type,
    adm_country, adm_region, adm_district, adm_loc,
    geo_nn, geo_ee, geo_origin,
    "eve_YY", "eve_MM", "eve_DD", eve_habitat,
    tax_fam, tax_gen, tax_sp, tax_sp_def,
    abu, type_status
)
VALUES
    -- Record 1: Adult male in forest litter
    (1, $DEV_TG_ID, NOW(), 'rec_ok',
     'Россия', 'Свердловская область', 'Горнозаводской р-н', 'п. Бисерть',
     56.9825, 59.3421, 'geocoder',
     2019, 7, 22, 'еловый лес, подстилка',
     'Linyphiidae', 'Bathyphantes', 'nigrinus', true,
     3, 'adult'),

    -- Record 2: Juvenile in meadow
    (1, $DEV_TG_ID, NOW(), 'rec_ok',
     'Россия', 'Свердловская область', 'г. Екатеринбург', 'УНЦ ЖДВ',
     56.8389, 60.6057, 'geocoder',
     2020, 6, 15, 'луг, разнотравье',
     'Araneidae', 'Araneus', 'diadematus', false,
     5, 'juvenile'),

    -- Record 3: Female with web in garden
    (1, $DEV_TG_ID, NOW(), 'rec_ok',
     'Россия', 'Челябинская область', 'г. Миасс', 'берег р. Миасс',
     55.0458, 60.1083, 'geocoder',
     2021, 8, 3, 'прибрежная растительность',
     'Tetragnathidae', 'Tetragnatha', 'montana', true,
     2, 'adult'),

    -- Record 4: Male in pine forest
    (1, $DEV_TG_ID, NOW(), 'rec_ok',
     'Россия', 'Пермский край', 'Кишертский р-н', 'д. Шумково',
     57.2341, 57.1234, 'geocoder',
     2018, 5, 18, 'сосновый лес',
     'Lycosidae', 'Pardosa', 'lugubris', true,
     7, 'adult'),

    -- Record 5: Multiple specimens, birch forest
    (1, $DEV_TG_ID, NOW(), 'rec_ok',
     'Россия', 'Свердловская область', 'Режевский р-н', '',
     57.3567, 61.2345, 'geocoder',
     2022, 9, 10, 'берёзовый лес',
     'Theridiidae', 'Robertus', 'lividus', true,
     4, 'adult');

EOSQL

echo "Sample data created successfully."
