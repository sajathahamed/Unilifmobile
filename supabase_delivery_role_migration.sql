-- Unified auth + delivery schema migration
-- Run this in Supabase SQL Editor.

-- 1) Rider online/offline status in one column
ALTER TABLE public.rider_profiles
ADD COLUMN IF NOT EXISTS online_status text NOT NULL DEFAULT 'offline'
CHECK (online_status IN ('online', 'offline', 'busy'));

ALTER TABLE public.rider_profiles
ADD COLUMN IF NOT EXISTS vehicle_type text;

-- 2) Assignment fields on orders
ALTER TABLE public.food_orders
ADD COLUMN IF NOT EXISTS assigned_delivery_person_id integer;

ALTER TABLE public.food_orders
ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'not_assigned'
CHECK (delivery_status IN ('not_assigned', 'pending', 'assigned', 'picked_up', 'delivered', 'failed', 'cancelled'));

ALTER TABLE public.laundry_orders
ADD COLUMN IF NOT EXISTS assigned_delivery_person_id integer;

ALTER TABLE public.laundry_orders
ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'not_assigned'
CHECK (delivery_status IN ('not_assigned', 'pending', 'assigned', 'picked_up', 'delivered', 'failed', 'cancelled'));

-- 3) Assignment history table for admin -> rider actions
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL,
  order_type text NOT NULL CHECK (order_type IN ('food', 'laundry')),
  delivery_person_id integer NOT NULL REFERENCES public.users(id),
  assigned_by_admin_id integer REFERENCES public.users(id),
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'cancelled')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON public.delivery_assignments(order_type, order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_rider ON public.delivery_assignments(delivery_person_id);

-- 4) Helpful indexes for dashboards
CREATE INDEX IF NOT EXISTS idx_food_orders_delivery_status ON public.food_orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_food_orders_assigned_rider ON public.food_orders(assigned_delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_laundry_orders_delivery_status ON public.laundry_orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_laundry_orders_assigned_rider ON public.laundry_orders(assigned_delivery_person_id);

-- 5) Ensure delivery users have rider profile row
INSERT INTO public.rider_profiles (user_id, phone, online_status)
SELECT u.id, null, 'offline'
FROM public.users u
LEFT JOIN public.rider_profiles rp ON rp.user_id = u.id
WHERE u.role = 'delivery' AND rp.user_id IS NULL;
