-- MELA HOUSE güvenlik sıkılaştırması (2026-10-06)
-- Uygulama kodunun tüm istemci sorguları zaten user_id ile filtreleniyor ve
-- admin işlemleri is_admin() ya da service_role ile yapılıyor; bu yüzden aşağıdaki
-- değişiklikler mevcut işleyişi bozmaz, sadece yetkisiz erişimi kapatır.

-- 1) Admin RPC'leri: yetki kontrolü yok, anon dahil herkes çağırabiliyordu.
--    Sadece sunucu (service_role) çağırabilsin.
revoke execute on function public.admin_update_user(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.admin_delete_user(uuid) from public, anon, authenticated;
revoke execute on function public.get_all_users_with_details() from public, anon, authenticated;
revoke execute on function public.get_admin_all_users() from public, anon, authenticated;
grant execute on function public.admin_update_user(uuid, text, text, text, text) to service_role;
grant execute on function public.admin_delete_user(uuid) to service_role;
grant execute on function public.get_all_users_with_details() to service_role;
grant execute on function public.get_admin_all_users() to service_role;

-- Ziyaretçi istatistiği sadece admin görsün
create or replace function public.get_visitor_stats(target_year integer default 2026)
returns json language plpgsql security definer set search_path = public as $$
declare
  today_date date := (now() at time zone 'Europe/Istanbul')::date;
  week_start date := today_date - interval '6 days';
  month_start date := date_trunc('month', today_date)::date;
  year_start date := (target_year || '-01-01')::date;
  year_end date := (target_year || '-12-31')::date;
  today_c int; week_c int; month_c int; year_c int;
begin
  if not public.is_admin() then
    raise exception 'yetkisiz';
  end if;
  select coalesce(sum(visitor_count), 0) into today_c from public.daily_unique_visitors where view_date = today_date;
  select coalesce(sum(visitor_count), 0) into week_c from public.daily_unique_visitors where view_date between week_start and today_date;
  select coalesce(sum(visitor_count), 0) into month_c from public.daily_unique_visitors where view_date between month_start and today_date;
  select coalesce(sum(visitor_count), 0) into year_c from public.daily_unique_visitors where view_date between year_start and year_end;
  return json_build_object('today', today_c, 'week', week_c, 'month', month_c, 'year', year_c);
end; $$;

alter function public.is_admin() set search_path = public;

-- 2) Adresler: USING(true) idi -> herkes herkesin adresini okuyup değiştirebiliyordu.
drop policy if exists "Users manage own addresses" on public.addresses;
create policy "Users manage own addresses" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Siparişler: SELECT USING(true) idi -> tüm siparişler herkese açıktı.
drop policy if exists "Users view own orders" on public.orders;
create policy "Users view own orders" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "Users create own orders" on public.orders;
create policy "Users create own orders" on public.orders
  for insert with check (auth.uid() = user_id);

-- İade talebi artık sunucu API'si üzerinden (service_role) yapılıyor;
-- müşterinin siparişin durumunu/tutarını doğrudan değiştirebilmesine gerek yok.
drop policy if exists "Users update own orders for return" on public.orders;

drop policy if exists "Users view own order items" on public.order_items;
create policy "Users view own order items" on public.order_items
  for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists "Users create own order items" on public.order_items;
create policy "Users create own order items" on public.order_items
  for insert with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- 4) Toptancı tabloları: USING(true) idi -> herkes yazıp silebiliyordu.
drop policy if exists "Admin full suppliers" on public.suppliers;
create policy "Admin full suppliers" on public.suppliers for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin full supplier_products" on public.supplier_products;
create policy "Admin full supplier_products" on public.supplier_products for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin full supplier_changes" on public.supplier_changes;
create policy "Admin full supplier_changes" on public.supplier_changes for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin full competitor_prices" on public.competitor_prices;
create policy "Admin full competitor_prices" on public.competitor_prices for all using (public.is_admin()) with check (public.is_admin());

-- 5) Profil: kullanıcı kendi satırını güncelleyebildiği için role='admin' yapabiliyordu.
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'Rol değişikliğine yetkiniz yok';
  end if;
  return new;
end; $$;
drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- 6) Storage: "Public Upload/Update/Delete Access" (true) herkesin her kovaya
--    dosya yükleyip silmesine izin veriyordu. Sadece admin yazabilsin.
drop policy if exists "Public Upload Access" on storage.objects;
drop policy if exists "Public Update Access" on storage.objects;
drop policy if exists "Public Delete Access" on storage.objects;
drop policy if exists "Admin can write content" on storage.objects;
create policy "Admin can write content" on storage.objects
  for all using (bucket_id = 'content' and public.is_admin()) with check (bucket_id = 'content' and public.is_admin());

-- 7) Shopier callback'in çağırdığı ama veritabanında olmayan stok düşme fonksiyonu
create or replace function public.decrement_stock(p_variant_id uuid, p_quantity int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants
     set stock_quantity = greatest(stock_quantity - p_quantity, 0)
   where id = p_variant_id;
end; $$;
revoke execute on function public.decrement_stock(uuid, int) from public, anon, authenticated;
grant execute on function public.decrement_stock(uuid, int) to service_role;
