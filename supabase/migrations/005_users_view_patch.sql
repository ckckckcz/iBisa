-- NOTE: DROP + CREATE (bukan CREATE OR REPLACE) karena REPLACE tidak boleh
-- menyisipkan kolom baru di tengah definisi view (error 42P16).
drop view if exists public.users_with_role;

create view public.users_with_role as
  select u.id, u.email, u.full_name, u.role_id, u.school_id, u.whatsapp, r.name as role, u.created_at
  from public.users u join public.roles r on r.id = u.role_id;
