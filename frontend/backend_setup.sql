-- MICUL PRODUCATOR - DATABASE SCHEMA
-- Execute this in the Supabase SQL Editor

-- 1. Create the Main Ads Table
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    categories TEXT[] DEFAULT '{}' NOT NULL,
    images TEXT[] DEFAULT '{}' NOT NULL,
    
    -- Contact & Security
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    token TEXT NOT NULL, -- Secret key for management without password
    
    -- Location Data (for Route Engine)
    location JSONB NOT NULL DEFAULT '{"county": "", "city": ""}'::jsonb,
    
    -- Status & Monetization
    status TEXT DEFAULT 'pending' NOT NULL, -- pending, active, expired
    is_premium BOOLEAN DEFAULT false NOT NULL,
    expires_at TIMESTAMPTZ,
    
    -- Social & Analytics
    rating NUMERIC(3, 2) DEFAULT 0 NOT NULL,
    reviews JSONB DEFAULT '[]'::jsonb NOT NULL, -- Array of {author, rating, comment, date}
    stats JSONB DEFAULT '{"views": 0, "whatsappClicks": 0, "favorites": 0}'::jsonb NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- 3. Define Policies

-- POLICY: Anyone can view active, non-expired ads
CREATE POLICY "Public can view active ads" 
ON public.ads FOR SELECT 
USING (
    status = 'active' 
    AND (expires_at IS NULL OR expires_at > now())
);

-- POLICY: Anyone can create a pending ad (starting the payment flow)
CREATE POLICY "Anyone can create an ad" 
ON public.ads FOR INSERT 
WITH CHECK (true);

-- POLICY: Only holders of the secret token can update their own ad
-- This is checked via the 'x-manage-token' header or direct match
CREATE POLICY "Owners can update with token" 
ON public.ads FOR UPDATE 
USING (token = current_setting('request.headers')::json->>'x-manage-token')
WITH CHECK (token = current_setting('request.headers')::json->>'x-manage-token');

-- POLICY: Owners can delete with token
CREATE POLICY "Owners can delete with token" 
ON public.ads FOR DELETE 
USING (token = current_setting('request.headers')::json->>'x-manage-token');

-- 4. Create Indexes for Performance
CREATE INDEX idx_ads_status ON public.ads(status);
CREATE INDEX idx_ads_location_county ON public.ads((location->>'county'));
CREATE INDEX idx_ads_premium ON public.ads(is_premium) WHERE is_premium = true;
