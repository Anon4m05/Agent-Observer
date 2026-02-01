-- Profiles table for researcher data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Submolts table (communities)
CREATE TABLE public.submolts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.submolts ENABLE ROW LEVEL SECURITY;

-- Submolts are readable by authenticated users
CREATE POLICY "Authenticated users can view submolts" ON public.submolts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert submolts" ON public.submolts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update submolts" ON public.submolts
  FOR UPDATE TO authenticated USING (true);

-- Agents table (AI agents on Moltbook)
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  post_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Agents are readable by authenticated users
CREATE POLICY "Authenticated users can view agents" ON public.agents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert agents" ON public.agents
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update agents" ON public.agents
  FOR UPDATE TO authenticated USING (true);

-- Posts table (append-only archive)
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  agent_id UUID REFERENCES public.agents(id),
  submolt_id UUID REFERENCES public.submolts(id),
  title TEXT,
  content TEXT,
  url TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Post-level computed features
  char_count INTEGER,
  word_count INTEGER,
  link_count INTEGER,
  unique_words INTEGER,
  avg_word_length NUMERIC(5,2),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Posts are readable by authenticated users
CREATE POLICY "Authenticated users can view posts" ON public.posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert posts" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (true);

-- Comments table (append-only archive)
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  post_id UUID REFERENCES public.posts(id),
  agent_id UUID REFERENCES public.agents(id),
  parent_comment_id UUID REFERENCES public.comments(id),
  content TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  reply_depth INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Comment-level computed features
  char_count INTEGER,
  word_count INTEGER,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments are readable by authenticated users
CREATE POLICY "Authenticated users can view comments" ON public.comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Scrape jobs table for tracking ingestion
CREATE TABLE public.scrape_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  scope TEXT NOT NULL DEFAULT 'full' CHECK (scope IN ('full', 'submolt', 'agent')),
  target_id TEXT,
  posts_scraped INTEGER DEFAULT 0,
  comments_scraped INTEGER DEFAULT 0,
  agents_discovered INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scrape jobs
CREATE POLICY "Users can view their own scrape jobs" ON public.scrape_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scrape jobs" ON public.scrape_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scrape jobs" ON public.scrape_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Settings table for user preferences
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_scrape_enabled BOOLEAN DEFAULT false,
  scrape_interval_hours INTEGER DEFAULT 6,
  last_auto_scrape_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own settings
CREATE POLICY "Users can view their own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX idx_posts_agent_id ON public.posts(agent_id);
CREATE INDEX idx_posts_submolt_id ON public.posts(submolt_id);
CREATE INDEX idx_posts_posted_at ON public.posts(posted_at DESC);
CREATE INDEX idx_posts_scraped_at ON public.posts(scraped_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_agent_id ON public.comments(agent_id);
CREATE INDEX idx_comments_posted_at ON public.comments(posted_at DESC);
CREATE INDEX idx_agents_username ON public.agents(username);
CREATE INDEX idx_agents_last_seen ON public.agents(last_seen_at DESC);
CREATE INDEX idx_submolts_name ON public.submolts(name);
CREATE INDEX idx_scrape_jobs_user_status ON public.scrape_jobs(user_id, status);

-- Function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();