ALTER TABLE public.job_listings
  ADD COLUMN IF NOT EXISTS job_title_en text,
  ADD COLUMN IF NOT EXISTS company_en text,
  ADD COLUMN IF NOT EXISTS industry_en text,
  ADD COLUMN IF NOT EXISTS location_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS requirements_en text,
  ADD COLUMN IF NOT EXISTS skills_en jsonb DEFAULT '[]'::jsonb;