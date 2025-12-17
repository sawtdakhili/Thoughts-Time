-- Thoughts & Time Database Initialization Script
-- This script sets up the database schema for self-hosted deployments

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create items table (if not exists)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('todo', 'event', 'routine', 'note')),
    content TEXT NOT NULL,
    scheduled_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    recurrence_pattern JSONB,
    parent_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    parent_type TEXT,
    depth_level INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completion_date TIMESTAMPTZ,
    completion_link_id UUID REFERENCES public.items(id),
    created_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    link_previews JSONB,
    CONSTRAINT valid_depth CHECK (depth_level >= 0 AND depth_level <= 2)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS items_user_id_idx ON public.items(user_id);
CREATE INDEX IF NOT EXISTS items_scheduled_time_idx ON public.items(scheduled_time);
CREATE INDEX IF NOT EXISTS items_parent_id_idx ON public.items(parent_id);
CREATE INDEX IF NOT EXISTS items_type_idx ON public.items(type);
CREATE INDEX IF NOT EXISTS items_created_date_idx ON public.items(created_date);
CREATE INDEX IF NOT EXISTS items_completed_idx ON public.items(completed);

-- Enable Row Level Security
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own items" ON public.items;
CREATE POLICY "Users can view their own items"
    ON public.items FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own items" ON public.items;
CREATE POLICY "Users can insert their own items"
    ON public.items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF NOT EXISTS "Users can update their own items" ON public.items;
CREATE POLICY "Users can update their own items"
    ON public.items FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own items" ON public.items;
CREATE POLICY "Users can delete their own items"
    ON public.items FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS items_updated_at ON public.items;
CREATE TRIGGER items_updated_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT SELECT ON public.items TO anon;

-- Add comment to table
COMMENT ON TABLE public.items IS 'Main table for storing all item types (todos, events, routines, notes)';
