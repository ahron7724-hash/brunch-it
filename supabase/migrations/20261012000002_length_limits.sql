-- Lea site: text length limits on every free-text column (defense in depth beyond zod),
-- and the max-3 trigger function rewritten as static SQL (no `execute format(...)`).

create or replace function public.enforce_max_three_per_product()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  existing int;
begin
  if tg_table_name = 'product_images' then
    select count(*) into existing from public.product_images
      where product_id = new.product_id and id <> new.id;
    if existing >= 3 then
      raise exception 'מותר עד 3 תמונות לכל מוצר.' using errcode = 'check_violation';
    end if;
  elsif tg_table_name = 'product_sizes' then
    select count(*) into existing from public.product_sizes
      where product_id = new.product_id and id <> new.id;
    if existing >= 3 then
      raise exception 'מותר עד 3 גדלים לכל מוצר.' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

alter table public.categories
  add constraint categories_name_len check (char_length(name) between 1 and 80),
  add constraint categories_slug_fmt check (slug ~ '^[a-z0-9א-ת]+(-[a-z0-9א-ת]+)*$' and char_length(slug) <= 100),
  add constraint categories_description_len check (char_length(description) <= 1000),
  add constraint categories_image_url_len check (char_length(image_url) <= 2048);

alter table public.products
  add constraint products_title_len check (char_length(title) between 1 and 120),
  add constraint products_slug_fmt check (slug ~ '^[a-z0-9א-ת]+(-[a-z0-9א-ת]+)*$' and char_length(slug) <= 140),
  add constraint products_description_len check (char_length(description) <= 4000),
  add constraint products_contents_len check (char_length(contents) <= 2000),
  add constraint products_custom_text_label_len check (char_length(custom_text_label) <= 80),
  add constraint products_lead_time_max check (min_lead_time_hours <= 24 * 60);

alter table public.product_images
  add constraint product_images_url_len check (char_length(url) <= 2048),
  add constraint product_images_alt_len check (char_length(alt) <= 200);

alter table public.product_sizes
  add constraint product_sizes_label_len check (char_length(label) between 1 and 60),
  add constraint product_sizes_serves_len check (char_length(serves) <= 80),
  add constraint product_sizes_price_max check (price <= 100000);

alter table public.product_options
  add constraint product_options_group_len check (char_length(group_name) between 1 and 60),
  add constraint product_options_label_len check (char_length(label) between 1 and 80),
  add constraint product_options_price_max check (extra_price <= 100000);

alter table public.date_overrides
  add constraint date_overrides_note_len check (char_length(note) <= 200);

alter table public.delivery_zones
  add constraint delivery_zones_name_len check (char_length(name) between 1 and 80),
  add constraint delivery_zones_price_max check (price <= 10000 and min_order <= 100000);

alter table public.testimonials
  add constraint testimonials_name_len check (char_length(client_name) between 1 and 80),
  add constraint testimonials_content_len check (char_length(content) between 1 and 1000),
  add constraint testimonials_event_len check (char_length(event_label) <= 80),
  add constraint testimonials_image_url_len check (char_length(image_url) <= 2048);

alter table public.hero_slides
  add constraint hero_slides_url_len check (char_length(url) <= 2048),
  add constraint hero_slides_alt_len check (char_length(alt) <= 200);

alter table public.strip_images
  add constraint strip_images_url_len check (char_length(url) <= 2048),
  add constraint strip_images_alt_len check (char_length(alt) <= 200);

alter table public.pages
  add constraint pages_title_len check (char_length(title) between 1 and 120),
  add constraint pages_hero_url_len check (char_length(hero_image_url) <= 2048),
  add constraint pages_body_len check (char_length(body_html) <= 50000);

alter table public.gallery_images
  add constraint gallery_images_url_len check (char_length(url) <= 2048),
  add constraint gallery_images_alt_len check (char_length(alt) <= 200),
  add constraint gallery_images_caption_len check (char_length(caption) <= 200);

alter table public.orders
  add constraint orders_name_len check (char_length(customer_name) between 2 and 80),
  add constraint orders_phone_fmt check (customer_phone ~ '^\+?[0-9]{7,15}$'),
  add constraint orders_email_len check (char_length(customer_email) between 3 and 254),
  add constraint orders_notes_len check (char_length(notes) <= 1000),
  add constraint orders_zone_name_len check (char_length(delivery_zone_name) <= 80),
  add constraint orders_address_len check (char_length(delivery_address) <= 300),
  add constraint orders_amounts_nonneg check (delivery_fee >= 0 and subtotal >= 0 and total >= 0),
  add constraint orders_slot_order check (slot_end > slot_start),
  add constraint orders_payment_provider_len check (char_length(payment_provider) <= 40),
  add constraint orders_payment_ref_len check (char_length(payment_reference) <= 200);

alter table public.order_items
  add constraint order_items_title_len check (char_length(product_title) between 1 and 120),
  add constraint order_items_size_len check (char_length(size_label) between 1 and 60),
  add constraint order_items_custom_text_len check (char_length(custom_text) <= 200),
  add constraint order_items_quantity_max check (quantity <= 99),
  add constraint order_items_amounts_nonneg check (unit_price >= 0 and line_total >= 0),
  add constraint order_items_options_array check (jsonb_typeof(options) = 'array');
