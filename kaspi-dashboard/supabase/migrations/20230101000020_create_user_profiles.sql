-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles" ON public.user_profiles
  FOR UPDATE USING (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create a trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (new.id, new.email, 'viewer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Example RLS policies for other tables (to be expanded later)
-- Granting admin access to everything for demonstration
-- NOTE: You strictly said "Create migration for RLS policies (defining access rules)"

-- Enable RLS on core tables if not already enabled
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can view, only admins/managers can edit
DROP POLICY IF EXISTS "Public read access to products" ON products;
CREATE POLICY "Public read access to products" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and Managers can insert products" ON products;
CREATE POLICY "Admins and Managers can insert products" ON products
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admins and Managers can update products" ON products;
CREATE POLICY "Admins and Managers can update products" ON products
  FOR UPDATE USING (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admins and Managers can delete products" ON products;
CREATE POLICY "Admins and Managers can delete products" ON products
  FOR DELETE USING (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role IN ('admin', 'manager')
    )
  );
