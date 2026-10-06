-- Sipariş numarası: eski marka öneki VLR- yerine MH-YYYYMMDD-NNNN (İstanbul saatine göre gün)
-- Aynı anda gelen siparişler aynı numarayı almasın diye işlem kilidi kullanılır.
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
revoke execute on function public.generate_order_number() from public, anon, authenticated;
