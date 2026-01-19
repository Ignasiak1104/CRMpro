
-- 1. Tabela PROFILI (UserProfile)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    first_name text DEFAULT '',
    last_name text DEFAULT '',
    role text DEFAULT 'User' CHECK (role IN ('Admin', 'User', 'Manager')),
    created_at timestamptz DEFAULT now()
);

-- 2. Funkcja i trigger do automatycznego tworzenia profilu przy rejestracji w Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (new.id, new.email, '', '');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usuwamy trigger jeśli istnieje i tworzymy na nowo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Włączenie Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Polityka: Każdy zalogowany użytkownik widzi profile innych (aby widzieć zespół)
DROP POLICY IF EXISTS "Profile są widoczne dla zalogowanych" ON public.profiles;
CREATE POLICY "Profile są widoczne dla zalogowanych" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Polityka: Użytkownik może edytować tylko swój własny profil
DROP POLICY IF EXISTS "Użytkownik może edytować swój profil" ON public.profiles;
CREATE POLICY "Użytkownik może edytować swój profil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Upewnienie się, że inne tabele mają włączone RLS i dostęp dla zespołu
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Dostęp dla zalogowanych - firmy" ON companies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Dostęp dla zalogowanych - kontakty" ON contacts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Dostęp dla zalogowanych - szanse" ON deals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Dostęp dla zalogowanych - zadania" ON tasks FOR ALL USING (auth.role() = 'authenticated');
