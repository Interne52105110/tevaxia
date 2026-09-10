-- Requires 006 and 030. Pending administrative application; Vercel does not apply SQL.
BEGIN;
ALTER TABLE public.rental_cotenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cotenants_owned_lot_guard ON public.rental_cotenants;
CREATE POLICY cotenants_owned_lot_guard ON public.rental_cotenants
 AS RESTRICTIVE FOR ALL TO PUBLIC
 USING (user_id=auth.uid() AND EXISTS (
   SELECT 1 FROM public.rental_lots l WHERE l.id=rental_cotenants.lot_id AND l.user_id=auth.uid()
 ))
 WITH CHECK (user_id=auth.uid() AND EXISTS (
   SELECT 1 FROM public.rental_lots l WHERE l.id=rental_cotenants.lot_id AND l.user_id=auth.uid()
 ));
COMMIT;
