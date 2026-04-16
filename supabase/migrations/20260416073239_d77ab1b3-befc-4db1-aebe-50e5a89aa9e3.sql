
-- Job listings (public example job database)
CREATE TABLE public.job_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  company_logo TEXT,
  job_title TEXT NOT NULL,
  industry TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'full-time',
  location TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'CNY',
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  skills JSONB NOT NULL DEFAULT '[]',
  experience_years INTEGER DEFAULT 0,
  education TEXT DEFAULT 'bachelor',
  company_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view job listings"
ON public.job_listings FOR SELECT
USING (true);

-- Resume versions
CREATE TABLE public.resume_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  version_name TEXT NOT NULL,
  content TEXT NOT NULL,
  original_content TEXT,
  target_job_id UUID REFERENCES public.job_listings(id),
  target_job_title TEXT,
  match_score INTEGER DEFAULT 0,
  rewrite_style TEXT DEFAULT 'achievement',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resume versions" ON public.resume_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resume versions" ON public.resume_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resume versions" ON public.resume_versions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resume versions" ON public.resume_versions FOR DELETE USING (auth.uid() = user_id);

-- Interview sessions
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  scores JSONB DEFAULT '[]',
  overall_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interview sessions" ON public.interview_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interview sessions" ON public.interview_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interview sessions" ON public.interview_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Job applications tracking
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_listing_id UUID REFERENCES public.job_listings(id),
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied',
  match_score INTEGER DEFAULT 0,
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  interview_at TIMESTAMP WITH TIME ZONE,
  offer_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" ON public.job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.job_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON public.job_applications FOR DELETE USING (auth.uid() = user_id);
