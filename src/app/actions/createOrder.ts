
"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function createOrder(addressId: number) {
  const supabase = supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not authenticated");

  // Load cart items with product prices
  const { data: items, error: cartErr } = await supabase
    .from("cart_items")
    .select("product_id, qty, products:product_id (price, discount_percent)")
    .eq("user_id", user.id);

  if (cartErr) throw new Error(cartErr.message);
  if (!items || items.length === 0) throw new Error("Cart is empty");

  const total = items.reduce((sum, row: any) => {
    const price = Number(row.products.price);
    const discount = Number(row.products.discount_percent || 0);
    const final = price * (1 - discount / 100);
    return sum + final * Number(row.qty);
  }, 0);

  // Create order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      address_id: addressId,
      total,
      payment_method: "UPI",
      payment_status: "pending",
      status: "placed",
    })
    .select("*")
    .single();

  if (orderErr) throw new Error(orderErr.message);

  // Insert order items
  const orderItems = items.map((row: any) => {
    const price = Number(row.products.price);
    const discount = Number(row.products.discount_percent || 0);
    const unit = price * (1 - discount / 100);
    return {
      order_id: order.id,
      product_id: row.product_id,
      qty: row.qty,
      unit_price: unit,
    };
  });

  const { error: oiErr } = await supabase.from("order_items").insert(orderItems);
  if (oiErr) throw new Error(oiErr.message);

  // Tracking entry
  const { error: trErr } = await supabase.from("order_tracking").insert({
    order_id: order.id,
    status: "placed",
    note: "Order placed",
  });
  if (trErr) throw new Error(trErr.message);

  // Clear cart
  await supabase.from("cart_items").delete().eq("user_id", user.id);

  return { orderId: order.id };
}
