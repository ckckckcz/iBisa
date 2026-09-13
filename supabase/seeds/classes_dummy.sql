-- 1) Dummy classes untuk sekolah yang sudah ada
with s as (
  select school_id as id from public.users
  where school_id is not null
  group by school_id order by count(*) desc limit 1
)
insert into public.classes (school_id, name, tingkat, wali_guru_id)
select s.id, c.name, c.tingkat, null
from s cross join (values
  ('10-A','10'), ('10-B','10'),
  ('11-A','11'), ('11-B','11'),
  ('12-A','12'), ('12-B','12')
) as c(name, tingkat)
on conflict (school_id, name) do nothing;

-- 2) Isi class_id murid yang masih NULL dengan mencocokkan grade -> nama kelas.
update public.users u
set class_id = c.id
from public.classes c
where u.class_id is null
  and u.grade is not null
  and c.school_id = u.school_id
  and c.name = u.grade;
