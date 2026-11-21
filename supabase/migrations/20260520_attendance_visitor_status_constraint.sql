do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'attendance'
      and column_name = 'visitor_status'
  ) then
    alter table public.attendance
      drop constraint if exists attendance_visitor_status_check;

    update public.attendance
    set visitor_status = case lower(visitor_status)
      when 'mahasiswa' then 'Mahasiswa'
      when 'dosen' then 'Dosen'
      when 'umum' then 'Umum'
      else 'Umum'
    end
    where visitor_status is not null;

    alter table public.attendance
      add constraint attendance_visitor_status_check
      check (visitor_status in ('Mahasiswa', 'Dosen', 'Umum'));
  end if;
end $$;
