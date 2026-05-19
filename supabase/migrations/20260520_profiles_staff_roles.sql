do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    alter table public.profiles
      drop constraint if exists profiles_role_check;

    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('admin', 'petugas', 'dosen', 'mahasiswa'));
  end if;
end $$;
