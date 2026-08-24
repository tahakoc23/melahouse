// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopierCallback } from '@/lib/shopier';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const postData = Object.fromEntries(formData.entries());
    
    const isValid = verifyShopierCallback(postData);

    if (!isValid) {
      console.error('Invalid Shopier signature', postData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/odeme/hata?reason=invalid_signature`);
    }

    const status = postData.status;
    const orderId = postData.platform_order_id as string;

    const supabase = createAdminClient();

    if (status === 'success') {
      // Update order status
      const { data: order, error: orderError } = await supabase
        .from('orders' as any)
        .update({ status: 'hazirlaniyor' })
        .eq('id', orderId)
        .select('*')
        .single();

      if (orderError || !order) {
        console.error('Failed to update order status:', orderError);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/odeme/hata?reason=order_not_found`);
      }

      // Fetch order items to decrease stock and send email
      const { data: orderItems } = await supabase
        .from('order_items' as any)
        .select('*, product_variants(stock_quantity)')
        .eq('order_id', orderId) as any;

      // Decrease stock quantities
      if (orderItems) {
        for (const item of orderItems) {
          if (item.variant_id) {
            // Simplified stock update - in a real app, you'd use a postgres function/RPC to prevent race conditions
            await supabase.rpc('decrement_stock', {
              p_variant_id: item.variant_id,
              p_quantity: item.quantity
            });
          }
        }
      }

      // Fetch user details for email
      const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
      
      if (userData && userData.user) {
        const customerEmail = userData.user.email || '';
        const customerName = userData.user.user_metadata?.full_name || 'Değerli Müşterimiz';
        
        // Try to send order confirmation email
        try {
          await sendOrderConfirmation(order, orderItems || [], customerEmail, customerName);
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError);
          // Don't fail the callback just because email failed
        }
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/odeme/basarili?orderId=${orderId}`);
    } else {
      // Payment failed
      await supabase
        .from('orders' as any)
        .update({ status: 'iptal_edildi' })
        .eq('id', orderId);

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/odeme/hata?reason=payment_failed`);
    }
  } catch (error) {
    console.error('Shopier callback processing error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/odeme/hata?reason=server_error`);
  }
}
