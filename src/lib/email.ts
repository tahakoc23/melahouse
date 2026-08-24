import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_resend_api_key');
const fromEmail = process.env.EMAIL_FROM || 'Veloria <noreply@veloria.com.tr>';

export function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

export async function sendOrderConfirmation(order: any, orderItems: any[], customerEmail: string, customerName: string) {
  const subject = `Siparişiniz Alındı #${order.id.substring(0, 8)}`;
  
  // Basic HTML template - in a real app, you'd probably fetch this from DB
  let itemsList = '';
  orderItems.forEach(item => {
    itemsList += `<li>${item.quantity}x Ürün (ID: ${item.product_id}) - ${item.price} TL</li>`;
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1A1A1A;">Siparişiniz Alındı</h1>
      <p>Merhaba ${customerName},</p>
      <p>Siparişiniz başarıyla alınmıştır ve hazırlanma sürecine girmiştir.</p>
      <h2>Sipariş Detayları:</h2>
      <p><strong>Sipariş Numarası:</strong> #${order.id.substring(0, 8)}</p>
      <p><strong>Toplam Tutar:</strong> ${order.total_amount} TL</p>
      <ul>
        ${itemsList}
      </ul>
      <p>Siparişiniz kargoya verildiğinde size tekrar bilgi vereceğiz.</p>
      <p>Bizi tercih ettiğiniz için teşekkür ederiz.</p>
      <p>Sevgilerle,<br>Veloria Ekibi</p>
    </div>
  `;

  return resend.emails.send({
    from: fromEmail,
    to: customerEmail,
    subject,
    html,
  });
}

export async function sendShippingNotification(order: any, trackingNumber: string, customerEmail: string) {
  const subject = `Siparişiniz Kargoya Verildi #${order.id.substring(0, 8)}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1A1A1A;">Siparişiniz Kargoya Verildi</h1>
      <p>Merhaba,</p>
      <p>#${order.id.substring(0, 8)} numaralı siparişiniz kargoya verilmiştir.</p>
      <p>Kargo Takip Numaranız: <strong>${trackingNumber}</strong></p>
      <p>Bizi tercih ettiğiniz için teşekkür ederiz.</p>
      <p>Sevgilerle,<br>Veloria Ekibi</p>
    </div>
  `;

  return resend.emails.send({
    from: fromEmail,
    to: customerEmail,
    subject,
    html,
  });
}

export async function sendCustomEmail(to: string | string[], subject: string, html: string) {
  return resend.emails.send({
    from: fromEmail,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
}
