-- =============================================================
-- Hirfa — Seed Data (تجريبي)
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run: cleans previous seed rows first
-- Password for all test users: Password123!
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Cleanup (order matters: children before parents)
-- ─────────────────────────────────────────────────────────────
DELETE FROM public.open_briefs
  WHERE id IN (
    'b0000001-0000-0000-0000-000000000001',
    'b0000001-0000-0000-0000-000000000002'
  );

DELETE FROM public.artist_profiles
  WHERE user_id IN (
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003'
  );

DELETE FROM public.users
  WHERE id IN (
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000001'
  );

DELETE FROM auth.users
  WHERE id IN (
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000001'
  );

-- ─────────────────────────────────────────────────────────────
-- 1. auth.users  (3 فنانين + عميل واحد)
-- ─────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change_token_new, email_change,
  created_at, updated_at
) VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'noura@hirfa.test',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"نورة الغامدي","role":"artist"}',
    '', '', '', '',
    now(), now()
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'salem@hirfa.test',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"سالم العتيبي","role":"artist"}',
    '', '', '', '',
    now(), now()
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'reem@hirfa.test',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"ريم السلمي","role":"artist"}',
    '', '', '', '',
    now(), now()
  ),
  (
    'c1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'mohammed@hirfa.test',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"محمد الزهراني","role":"client"}',
    '', '', '', '',
    now(), now()
  );

-- ─────────────────────────────────────────────────────────────
-- 2. public.users
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.users (id, phone, name, role, language, theme, created_at, updated_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', '+966501110001', 'نورة الغامدي',  'artist', 'ar', 'light', now(), now()),
  ('a1000000-0000-0000-0000-000000000002', '+966501110002', 'سالم العتيبي',  'artist', 'ar', 'light', now(), now()),
  ('a1000000-0000-0000-0000-000000000003', '+966501110003', 'ريم السلمي',    'artist', 'ar', 'light', now(), now()),
  ('c1000000-0000-0000-0000-000000000001', '+966501110004', 'محمد الزهراني', 'client', 'ar', 'light', now(), now());

-- ─────────────────────────────────────────────────────────────
-- 3. public.artist_profiles  (status = approved)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.artist_profiles (
  id, user_id,
  city, country, bio,
  categories, years_experience,
  status, rating_avg, orders_count, response_time,
  approved_at, created_at, updated_at
) VALUES
  (
    gen_random_uuid(),
    'a1000000-0000-0000-0000-000000000001',
    'الرياض', 'SA',
    'خطاطة متخصصة في الخط العربي الكلاسيكي والمعاصر. أعمل منذ ١٢ سنة في اللوحات الفنية وتصاميم الأفراح.',
    ARRAY['خط عربي'],
    12, 'approved', 4.9, 47, 'أقل من ساعة',
    now(), now(), now()
  ),
  (
    gen_random_uuid(),
    'a1000000-0000-0000-0000-000000000002',
    'جدة', 'SA',
    'فنان تشكيلي متخصص في الرسم بالألوان المائية والزيتية. أجسّد الطبيعة السعودية والشخصيات التراثية.',
    ARRAY['رسم'],
    7, 'approved', 4.7, 31, 'خلال ساعتين',
    now(), now(), now()
  ),
  (
    gen_random_uuid(),
    'a1000000-0000-0000-0000-000000000003',
    'الدمام', 'SA',
    'حرفية فخار وسيراميك. أصنع أواني وزينة مستوحاة من الفن الإسلامي مع لمسة عصرية.',
    ARRAY['فخار'],
    5, 'approved', 4.8, 22, 'خلال ٣ ساعات',
    now(), now(), now()
  );

-- ─────────────────────────────────────────────────────────────
-- 4. public.open_briefs  (status = open)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.open_briefs (
  id, client_id,
  title, description, category,
  budget_min, budget_max, currency,
  deadline, status, offers_count,
  created_at, updated_at
) VALUES
  (
    'b0000001-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'لوحة خط عربي لاسم العائلة',
    'أبحث عن خطاط يكتب اسم "آل الزهراني" بخط الثلث على قماش ٦٠×٤٠ سم مع إطار خشبي.',
    'خط عربي',
    200, 500, 'SAR',
    (CURRENT_DATE + INTERVAL '21 days')::date,
    'open', 0,
    now(), now()
  ),
  (
    'b0000001-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'هدية كروشيه لمولود جديد',
    'أريد سلة كروشيه مع بطانية صغيرة وحذاء مولود بألوان هادئة (أبيض وبيج).',
    'كروشيه',
    150, 350, 'SAR',
    (CURRENT_DATE + INTERVAL '14 days')::date,
    'open', 0,
    now(), now()
  );
