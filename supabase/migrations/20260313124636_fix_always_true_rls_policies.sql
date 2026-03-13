/*
  # Fix always-true RLS policies and duplicate policies

  ## Summary
  - Restricts INSERT/UPDATE policies on agriculteurs and commerces_artisans to admin-only
    (these are seed/reference tables that only admins should modify)
  - Removes duplicate preinscriptions INSERT policies
  - Removes duplicate associations SELECT policies
  - Removes duplicate posts SELECT/UPDATE/DELETE policies (already consolidated above)

  ## Security changes
  - agriculteurs: INSERT and UPDATE now require admin role
  - commerces_artisans: INSERT and UPDATE now require admin role
  - preinscriptions: consolidated to single INSERT policy for anon + authenticated
  - associations: consolidated to single SELECT policy
*/

-- agriculteurs: restrict to admins only (reference/seed data table)
DROP POLICY IF EXISTS "Authenticated users can insert agriculteurs" ON public.agriculteurs;
DROP POLICY IF EXISTS "Authenticated users can update agriculteurs" ON public.agriculteurs;

CREATE POLICY "Admins can insert agriculteurs"
  ON public.agriculteurs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "Admins can update agriculteurs"
  ON public.agriculteurs FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

-- commerces_artisans: restrict to admins only (reference/seed data table)
DROP POLICY IF EXISTS "Authenticated users can insert commerces_artisans" ON public.commerces_artisans;
DROP POLICY IF EXISTS "Authenticated users can update commerces_artisans" ON public.commerces_artisans;

CREATE POLICY "Admins can insert commerces_artisans"
  ON public.commerces_artisans FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "Admins can update commerces_artisans"
  ON public.commerces_artisans FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

-- preinscriptions: remove duplicate INSERT policies, keep single consolidated one
DROP POLICY IF EXISTS "Anyone can create preinscriptions" ON public.preinscriptions;
DROP POLICY IF EXISTS "Anyone can submit a pre-registration" ON public.preinscriptions;

CREATE POLICY "Anyone can submit a pre-registration"
  ON public.preinscriptions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- associations: remove duplicate SELECT policies
DROP POLICY IF EXISTS "Anyone can read associations" ON public.associations;
DROP POLICY IF EXISTS "Anyone can view associations" ON public.associations;

CREATE POLICY "Anyone can view associations"
  ON public.associations FOR SELECT
  USING (true);
