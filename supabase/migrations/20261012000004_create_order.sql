-- Inserts an order and its items in one transaction.
-- Called only from the server (service role) after the order was validated and priced from the DB.
create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_number bigint;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'order has no items' using errcode = 'check_violation';
  end if;

  insert into public.orders (
    customer_name, customer_phone, customer_email, notes,
    pickup_date, slot_start, slot_end, fulfillment,
    delivery_zone_id, delivery_zone_name, delivery_address, delivery_fee,
    subtotal, total, payment_status, payment_provider
  )
  values (
    p_order->>'customer_name', p_order->>'customer_phone', p_order->>'customer_email', p_order->>'notes',
    (p_order->>'pickup_date')::date, (p_order->>'slot_start')::time, (p_order->>'slot_end')::time, p_order->>'fulfillment',
    (p_order->>'delivery_zone_id')::uuid, p_order->>'delivery_zone_name', p_order->>'delivery_address',
    (p_order->>'delivery_fee')::numeric,
    (p_order->>'subtotal')::numeric, (p_order->>'total')::numeric,
    coalesce(p_order->>'payment_status', 'none'), p_order->>'payment_provider'
  )
  returning id, order_number into v_id, v_number;

  insert into public.order_items (
    order_id, product_id, product_title, size_label, unit_price, quantity, custom_text, options, line_total
  )
  select v_id, x.product_id, x.product_title, x.size_label, x.unit_price, x.quantity, x.custom_text,
         coalesce(x.options, '[]'::jsonb), x.line_total
  from jsonb_to_recordset(p_items) as x (
    product_id uuid, product_title text, size_label text, unit_price numeric,
    quantity int, custom_text text, options jsonb, line_total numeric
  );

  return jsonb_build_object('id', v_id, 'order_number', v_number);
end;
$$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;
