-- MELA HOUSE veritabanı şeması (Frankfurt / eu-central-1 projesi için, 2026-10-06)
-- Seul projesinden çıkarıldı; güvenlik sıkılaştırmaları ve MH- sipariş numarası dahil.

-- ============================================================
-- Tablolar
-- ============================================================
create table public.profiles (
  id uuid not null,
  email text not null,
  full_name text,
  phone text,
  role text default 'user'::text not null,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.addresses (
  id uuid default extensions.uuid_generate_v4() not null,
  user_id uuid not null,
  title text not null,
  full_name text not null,
  phone text not null,
  city text not null,
  district text not null,
  neighborhood text,
  address_line text not null,
  postal_code text,
  is_default boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.categories (
  id uuid default extensions.uuid_generate_v4() not null,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  parent_id uuid,
  sort_order integer default 0 not null,
  is_active boolean default true not null,
  seo_title text,
  seo_description text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.products (
  id uuid default extensions.uuid_generate_v4() not null,
  name text not null,
  slug text not null,
  description text,
  short_description text,
  fabric_info text,
  care_instructions text,
  base_price numeric(10,2) default 0 not null,
  sale_price numeric(10,2),
  category_id uuid,
  is_featured boolean default false not null,
  is_new boolean default false not null,
  is_active boolean default true not null,
  tags text[] default '{}'::text[],
  seo_title text,
  seo_description text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  is_out_of_stock boolean default false
);

create table public.product_images (
  id uuid default extensions.uuid_generate_v4() not null,
  product_id uuid not null,
  image_url text not null,
  alt_text text,
  sort_order integer default 0 not null,
  is_primary boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table public.product_variants (
  id uuid default extensions.uuid_generate_v4() not null,
  product_id uuid not null,
  color_name text,
  color_hex text,
  color_image_url text,
  size text,
  sku text,
  stock_quantity integer default 0 not null,
  price_override numeric(10,2),
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.orders (
  id uuid default extensions.uuid_generate_v4() not null,
  order_number text not null,
  user_id uuid,
  status text default 'odeme_bekliyor'::text not null,
  subtotal numeric(10,2) default 0 not null,
  shipping_cost numeric(10,2) default 0 not null,
  total numeric(10,2) default 0 not null,
  shipping_address jsonb,
  billing_address jsonb,
  cargo_tracking_number text,
  cargo_company text,
  shopier_payment_id text,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.order_items (
  id uuid default extensions.uuid_generate_v4() not null,
  order_id uuid not null,
  product_id uuid,
  variant_id uuid,
  product_name text not null,
  variant_info text,
  quantity integer default 1 not null,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  created_at timestamp with time zone default now() not null
);

create table public.reviews (
  id uuid default extensions.uuid_generate_v4() not null,
  product_id uuid not null,
  user_id uuid not null,
  rating integer not null,
  comment text,
  is_approved boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table public.wishlist (
  id uuid default extensions.uuid_generate_v4() not null,
  user_id uuid not null,
  product_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table public.site_content (
  id uuid default extensions.uuid_generate_v4() not null,
  content_key text not null,
  content_type text not null,
  title text,
  subtitle text,
  content jsonb default '{}'::jsonb,
  media_url text,
  link_url text,
  link_text text,
  sort_order integer default 0 not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.navigation_menus (
  id uuid default extensions.uuid_generate_v4() not null,
  name text not null,
  slug text not null,
  items jsonb default '[]'::jsonb not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.email_templates (
  id uuid default extensions.uuid_generate_v4() not null,
  name text not null,
  subject text not null,
  body_html text not null,
  template_type text not null,
  variables text[] default '{}'::text[],
  is_default boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.email_logs (
  id uuid default extensions.uuid_generate_v4() not null,
  template_id uuid,
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  status text default 'pending'::text not null,
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone default now() not null
);

create table public.daily_page_views (
  view_date date default CURRENT_DATE not null,
  view_count integer default 1 not null
);

create table public.daily_unique_visitors (
  view_date date default CURRENT_DATE not null,
  visitor_count integer default 1 not null
);

create table public.suppliers (
  id uuid default gen_random_uuid() not null,
  name text not null,
  domain text,
  website_url text,
  contact_person text,
  phone text,
  email text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.supplier_products (
  id uuid default gen_random_uuid() not null,
  supplier_id uuid,
  admin_product_id uuid,
  title text not null,
  product_url text not null,
  sku text,
  price numeric(10,2) default 0,
  stock_status text default 'stokta_var'::text,
  color text,
  fabric text,
  description text,
  image_url text,
  raw_metadata jsonb,
  last_scraped_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create table public.supplier_changes (
  id uuid default gen_random_uuid() not null,
  supplier_product_id uuid,
  field_changed text not null,
  old_value text,
  new_value text,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

create table public.competitor_prices (
  id uuid default gen_random_uuid() not null,
  supplier_product_id uuid,
  marketplace_name text not null,
  product_title text not null,
  product_url text not null,
  price numeric(10,2) not null,
  scraped_at timestamp with time zone default now()
);

-- ============================================================
-- Kısıtlar
-- ============================================================
alter table public.addresses add constraint addresses_pkey primary key (id);
alter table public.categories add constraint categories_pkey primary key (id);
alter table public.competitor_prices add constraint competitor_prices_pkey primary key (id);
alter table public.daily_page_views add constraint daily_page_views_pkey primary key (view_date);
alter table public.daily_unique_visitors add constraint daily_unique_visitors_pkey primary key (view_date);
alter table public.email_logs add constraint email_logs_pkey primary key (id);
alter table public.email_templates add constraint email_templates_pkey primary key (id);
alter table public.navigation_menus add constraint navigation_menus_pkey primary key (id);
alter table public.order_items add constraint order_items_pkey primary key (id);
alter table public.orders add constraint orders_pkey primary key (id);
alter table public.product_images add constraint product_images_pkey primary key (id);
alter table public.product_variants add constraint product_variants_pkey primary key (id);
alter table public.products add constraint products_pkey primary key (id);
alter table public.profiles add constraint profiles_pkey primary key (id);
alter table public.reviews add constraint reviews_pkey primary key (id);
alter table public.site_content add constraint site_content_pkey primary key (id);
alter table public.supplier_changes add constraint supplier_changes_pkey primary key (id);
alter table public.supplier_products add constraint supplier_products_pkey primary key (id);
alter table public.suppliers add constraint suppliers_pkey primary key (id);
alter table public.wishlist add constraint wishlist_pkey primary key (id);

alter table public.categories add constraint categories_slug_key unique (slug);
alter table public.navigation_menus add constraint navigation_menus_slug_key unique (slug);
alter table public.orders add constraint orders_order_number_key unique (order_number);
alter table public.product_variants add constraint product_variants_sku_key unique (sku);
alter table public.products add constraint products_slug_key unique (slug);
alter table public.site_content add constraint site_content_content_key_key unique (content_key);
alter table public.wishlist add constraint wishlist_user_id_product_id_key unique (user_id, product_id);

alter table public.email_logs add constraint email_logs_status_check check ((status = any (array['sent'::text, 'failed'::text, 'pending'::text])));
alter table public.email_templates add constraint email_templates_template_type_check check ((template_type = any (array['order_confirmation'::text, 'shipping'::text, 'return'::text, 'custom'::text, 'promotion'::text])));
alter table public.orders add constraint orders_status_check check ((status = any (array['odeme_bekliyor'::text, 'siparis_alindi'::text, 'odeme_alindi'::text, 'hazirlaniyor'::text, 'kargoya_verildi'::text, 'teslim_edildi'::text, 'iade_talebi'::text, 'iade_edildi'::text, 'iptal_edildi'::text])));
alter table public.profiles add constraint profiles_role_check check ((role = any (array['user'::text, 'admin'::text])));
alter table public.reviews add constraint reviews_rating_check check (((rating >= 1) and (rating <= 5)));
alter table public.site_content add constraint site_content_content_type_check check ((content_type = any (array['slider'::text, 'banner'::text, 'text'::text, 'video'::text, 'announcement'::text])));

alter table public.profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
alter table public.addresses add constraint addresses_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.categories add constraint categories_parent_id_fkey foreign key (parent_id) references public.categories(id) on delete set null;
alter table public.products add constraint products_category_id_fkey foreign key (category_id) references public.categories(id) on delete set null;
alter table public.product_images add constraint product_images_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;
alter table public.product_variants add constraint product_variants_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;
alter table public.orders add constraint orders_user_id_fkey foreign key (user_id) references public.profiles(id) on delete restrict;
alter table public.order_items add constraint order_items_order_id_fkey foreign key (order_id) references public.orders(id) on delete cascade;
alter table public.order_items add constraint order_items_product_id_fkey foreign key (product_id) references public.products(id) on delete set null;
alter table public.order_items add constraint order_items_variant_id_fkey foreign key (variant_id) references public.product_variants(id) on delete set null;
alter table public.reviews add constraint reviews_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;
alter table public.reviews add constraint reviews_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.wishlist add constraint wishlist_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;
alter table public.wishlist add constraint wishlist_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.email_logs add constraint email_logs_template_id_fkey foreign key (template_id) references public.email_templates(id) on delete set null;
alter table public.supplier_products add constraint supplier_products_supplier_id_fkey foreign key (supplier_id) references public.suppliers(id) on delete set null;
alter table public.supplier_products add constraint supplier_products_admin_product_id_fkey foreign key (admin_product_id) references public.products(id) on delete set null;
alter table public.supplier_changes add constraint supplier_changes_supplier_product_id_fkey foreign key (supplier_product_id) references public.supplier_products(id) on delete cascade;
alter table public.competitor_prices add constraint competitor_prices_supplier_product_id_fkey foreign key (supplier_product_id) references public.supplier_products(id) on delete cascade;

-- ============================================================
-- İndeksler
-- ============================================================
create unique index idx_reviews_user_product on public.reviews using btree (user_id, product_id);
create index idx_products_featured on public.products using btree (is_featured) where (is_featured = true);
create index idx_products_active on public.products using btree (is_active) where (is_active = true);
create index idx_products_slug on public.products using btree (slug);
create index idx_products_category on public.products using btree (category_id);
create index idx_variants_sku on public.product_variants using btree (sku);
create index idx_variants_product on public.product_variants using btree (product_id);
create index idx_product_images_product on public.product_images using btree (product_id);
create index idx_orders_number on public.orders using btree (order_number);
create index idx_orders_user on public.orders using btree (user_id);
create index idx_orders_status on public.orders using btree (status);
create index idx_order_items_order on public.order_items using btree (order_id);
create index idx_reviews_product on public.reviews using btree (product_id);
create index idx_wishlist_user on public.wishlist using btree (user_id);
create index idx_categories_parent on public.categories using btree (parent_id);
create index idx_categories_slug on public.categories using btree (slug);
create index idx_supplier_products_supplier on public.supplier_products using btree (supplier_id);
create index idx_supplier_products_admin_product on public.supplier_products using btree (admin_product_id);

-- ============================================================
-- Fonksiyonlar (hepsinde search_path sabit)
-- ============================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.update_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end; $$;

-- Mevcut davranış korunuyor: yeni üyelerin e-postası otomatik onaylanır
create or replace function public.auto_confirm_new_users()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.email_confirmed_at := now();
  return new;
end; $$;

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

create or replace function public.generate_order_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  today_tr date := (now() at time zone 'Europe/Istanbul')::date;
  prefix text := 'MH-' || to_char(today_tr, 'YYYYMMDD') || '-';
  seq_num int;
begin
  perform pg_advisory_xact_lock(hashtext('generate_order_number'));
  select coalesce(max(substring(order_number from length(prefix) + 1)::int), 0) + 1
    into seq_num
    from public.orders
   where order_number like prefix || '%'
     and substring(order_number from length(prefix) + 1) ~ '^\d+$';
  new.order_number := prefix || lpad(seq_num::text, 4, '0');
  return new;
end; $$;

create or replace function public.restore_stock_on_return()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'iade_edildi' and old.status != 'iade_edildi' then
    update public.product_variants pv
       set stock_quantity = pv.stock_quantity + oi.quantity
      from public.order_items oi
     where oi.order_id = new.id and oi.variant_id = pv.id;
  end if;
  return new;
end; $$;

create or replace function public.decrement_stock(p_variant_id uuid, p_quantity integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants
     set stock_quantity = greatest(stock_quantity - p_quantity, 0)
   where id = p_variant_id;
end; $$;

create or replace function public.increment_daily_page_view()
returns void language plpgsql security definer set search_path = public as $$
declare today_date date := (now() at time zone 'Europe/Istanbul')::date;
begin
  insert into public.daily_page_views (view_date, view_count) values (today_date, 1)
  on conflict (view_date) do update set view_count = public.daily_page_views.view_count + 1;
end; $$;

create or replace function public.increment_daily_unique_visitor()
returns void language plpgsql security definer set search_path = public as $$
declare today_date date := (now() at time zone 'Europe/Istanbul')::date;
begin
  insert into public.daily_unique_visitors (view_date, visitor_count) values (today_date, 1)
  on conflict (view_date) do update set visitor_count = public.daily_unique_visitors.visitor_count + 1;
end; $$;

create or replace function public.get_today_page_views()
returns integer language sql security definer set search_path = public as $$
  select coalesce((select view_count from public.daily_page_views
                    where view_date = (now() at time zone 'Europe/Istanbul')::date), 0);
$$;

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

create or replace function public.get_admin_all_users()
returns json language sql security definer set search_path = public as $$
  select json_agg(json_build_object('id', p.id, 'email', p.email, 'full_name', p.full_name,
                                    'phone', p.phone, 'role', p.role, 'created_at', p.created_at))
    from public.profiles p;
$$;

create or replace function public.get_all_users_with_details()
returns json language plpgsql security definer set search_path = public as $$
declare result json;
begin
  select json_agg(u) into result from (
    select p.id, p.email, p.full_name, p.phone, p.role, p.created_at,
           coalesce((select json_agg(a.*) from public.addresses a where a.user_id = p.id), '[]'::json) as addresses,
           coalesce((select json_agg(o.*) from public.orders o where o.user_id = p.id), '[]'::json) as orders
      from public.profiles p
     order by p.created_at desc
  ) u;
  return coalesce(result, '[]'::json);
end; $$;

create or replace function public.admin_update_user(
  target_user_id uuid, new_email text default null, new_password text default null,
  new_full_name text default null, new_role text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if new_email is not null and new_email <> '' then
    update auth.users set email = new_email where id = target_user_id;
  end if;
  if new_password is not null and new_password <> '' then
    update auth.users set encrypted_password = crypt(new_password, gen_salt('bf')) where id = target_user_id;
  end if;
  update public.profiles
     set email = coalesce(nullif(new_email, ''), email),
         full_name = coalesce(nullif(new_full_name, ''), full_name),
         role = coalesce(nullif(new_role, ''), role)
   where id = target_user_id;
  return json_build_object('success', true);
exception when others then
  return json_build_object('success', false, 'error', sqlerrm);
end; $$;

create or replace function public.admin_delete_user(target_user_id uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  delete from public.order_items where order_id in (select id from public.orders where user_id = target_user_id);
  delete from public.orders where user_id = target_user_id;
  delete from public.addresses where user_id = target_user_id;
  delete from public.wishlist where user_id = target_user_id;
  delete from public.reviews where user_id = target_user_id;
  delete from public.profiles where id = target_user_id;
  delete from auth.users where id = target_user_id;
  return json_build_object('success', true);
exception when others then
  return json_build_object('success', false, 'error', sqlerrm);
end; $$;

-- Yetkiler: admin fonksiyonları sadece sunucu (service_role)
revoke execute on function public.admin_update_user(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.admin_delete_user(uuid) from public, anon, authenticated;
revoke execute on function public.get_all_users_with_details() from public, anon, authenticated;
revoke execute on function public.get_admin_all_users() from public, anon, authenticated;
revoke execute on function public.decrement_stock(uuid, integer) from public, anon, authenticated;
revoke execute on function public.generate_order_number() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.auto_confirm_new_users() from public, anon, authenticated;
revoke execute on function public.restore_stock_on_return() from public, anon, authenticated;
revoke execute on function public.prevent_role_escalation() from public, anon, authenticated;
grant execute on function public.admin_update_user(uuid, text, text, text, text) to service_role;
grant execute on function public.admin_delete_user(uuid) to service_role;
grant execute on function public.get_all_users_with_details() to service_role;
grant execute on function public.get_admin_all_users() to service_role;
grant execute on function public.decrement_stock(uuid, integer) to service_role;

-- ============================================================
-- Tetikleyiciler
-- ============================================================
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create trigger tr_auto_confirm_users before insert on auth.users for each row execute function public.auto_confirm_new_users();
create trigger set_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.addresses for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.categories for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.products for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.product_variants for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.orders for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.site_content for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.navigation_menus for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.email_templates for each row execute function public.update_updated_at();
create trigger set_order_number before insert on public.orders for each row
  when (new.order_number is null or new.order_number = '') execute function public.generate_order_number();
create trigger on_order_returned after update on public.orders for each row execute function public.restore_stock_on_return();
create trigger trg_prevent_role_escalation before update on public.profiles for each row execute function public.prevent_role_escalation();

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.site_content enable row level security;
alter table public.navigation_menus enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_logs enable row level security;
alter table public.daily_page_views enable row level security;
alter table public.daily_unique_visitors enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_products enable row level security;
alter table public.supplier_changes enable row level security;
alter table public.competitor_prices enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admin can view all profiles" on public.profiles for select using (public.is_admin());
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admin can update all profiles" on public.profiles for update using (public.is_admin());

create policy "Users manage own addresses" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admin can view all addresses" on public.addresses for select using (public.is_admin());

create policy "Public Read Categories" on public.categories for select using (true);
create policy "Admin full access categories" on public.categories for all using (public.is_admin());

create policy "Public Read Products" on public.products for select using (true);
create policy "Admin full access products" on public.products for all using (public.is_admin());

create policy "Public Read Product Images" on public.product_images for select using (true);
create policy "Admin full access product_images" on public.product_images for all using (public.is_admin());

create policy "Public Read Product Variants" on public.product_variants for select using (true);
create policy "Admin full access variants" on public.product_variants for all using (public.is_admin());

create policy "Users view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users create own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Admin full access orders" on public.orders for all using (public.is_admin());

create policy "Users view own order items" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));
create policy "Users create own order items" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));
create policy "Admin full access order_items" on public.order_items for all using (public.is_admin());

create policy "Anyone can view approved reviews" on public.reviews for select using (is_approved = true);
create policy "Users can create reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews" on public.reviews for update using (auth.uid() = user_id);
create policy "Admin full access reviews" on public.reviews for all using (public.is_admin());

create policy "Users manage own wishlist" on public.wishlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Public Read Site Content" on public.site_content for select using (true);
create policy "Admin full access site_content" on public.site_content for all using (public.is_admin());

create policy "Anyone can view active menus" on public.navigation_menus for select using (is_active = true);
create policy "Admin full access menus" on public.navigation_menus for all using (public.is_admin());

create policy "Admin full access email_templates" on public.email_templates for all using (public.is_admin());
create policy "Admin full access email_logs" on public.email_logs for all using (public.is_admin());

create policy "Admin full suppliers" on public.suppliers for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin full supplier_products" on public.supplier_products for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin full supplier_changes" on public.supplier_changes for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin full competitor_prices" on public.competitor_prices for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Storage
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('products', 'products', true, 524288000),
       ('media', 'media', true, 524288000),
       ('content', 'content', true, 524288000)
on conflict (id) do nothing;

create policy "Anyone can view product images" on storage.objects for select using (bucket_id = 'products');
create policy "Admin can upload product images" on storage.objects for insert with check (bucket_id = 'products' and public.is_admin());
create policy "Admin can update product images" on storage.objects for update using (bucket_id = 'products' and public.is_admin());
create policy "Admin can delete product images" on storage.objects for delete using (bucket_id = 'products' and public.is_admin());

create policy "Anyone can view media" on storage.objects for select using (bucket_id = 'media');
create policy "Admin can upload media" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy "Admin can update media" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy "Admin can delete media" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

create policy "Anyone can view content" on storage.objects for select using (bucket_id = 'content');
create policy "Admin can write content" on storage.objects for all
  using (bucket_id = 'content' and public.is_admin()) with check (bucket_id = 'content' and public.is_admin());
