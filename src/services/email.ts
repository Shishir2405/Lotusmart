

import axios from "axios";
import type { IAddress, IOrderItem } from "@/types";


const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const API_KEY = process.env.BREVO_API_KEY ?? "";
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL ?? "noreply@lotusmart.com";
const SENDER_NAME = process.env.BREVO_SENDER_NAME ?? "LotusMart";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");


const COLOR = {
  cream: "#FFFDF7",
  creamBg: "#F5F5F0",
  creamBorder: "#EBE8D8",
  rose: "#E84672",
  oliveHeading: "#4D4529",
  oliveLight: "#7A6E42",
  textDark: "#1C1917",
  textMid: "#57534E",
  textMuted: "#78716C",
  white: "#ffffff",
} as const;

const btnStyle = [
  `display:inline-block`,
  `background:${COLOR.rose}`,
  `color:${COLOR.white}`,
  `padding:14px 36px`,
  `border-radius:8px`,
  `text-decoration:none`,
  `font-weight:600`,
  `font-size:15px`,
  `letter-spacing:0.2px`,
  `margin:16px 0`,
].join(";");

const labelStyle = `font-size:12px;color:${COLOR.textMuted};text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px;`;
const valueStyle = `font-size:15px;font-weight:600;color:${COLOR.textDark};margin:0;`;


function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
    body { margin:0; padding:0; background:${COLOR.creamBg}; -webkit-text-size-adjust:100%; }
    * { box-sizing:border-box; }
  </style>
</head>
<body style="margin:0;padding:0;background:${COLOR.creamBg};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:${COLOR.creamBg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="font-family:'DM Sans','Segoe UI',sans-serif;background:${COLOR.cream};
                      border-radius:16px;overflow:hidden;
                      box-shadow:0 4px 32px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,${COLOR.oliveHeading} 0%,${COLOR.oliveLight} 100%);
                       padding:36px 48px;text-align:center;">
              <h1 style="margin:0;color:#FFF9E8;font-size:30px;font-weight:700;letter-spacing:-0.5px;">
                🌸 LotusMart
              </h1>
              <p style="margin:6px 0 0;color:#FFE0B2;font-size:13px;font-weight:400;letter-spacing:0.3px;">
                Premium Spices &amp; Dry Fruits
              </p>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="padding:48px;background:${COLOR.cream};">
              ${content}
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="padding:28px 48px;background:${COLOR.creamBorder};text-align:center;
                       border-top:1px solid #DDD8C4;">
              <p style="margin:0 0 6px;font-size:12px;color:${COLOR.textMuted};line-height:1.6;">
                © ${new Date().getFullYear()} LotusMart. All rights reserved.<br/>
                123, Spice Market Lane, Mumbai 400001, India
              </p>
              <a href="${APP_URL}" style="color:${COLOR.oliveLight};font-size:12px;text-decoration:none;
                                          font-weight:500;">www.lotusmart.com</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}


export interface EmailRecipient {
  email: string;
  name?: string;
}


export async function sendEmail(
  to: EmailRecipient,
  subject: string,
  htmlContent: string,
): Promise<void> {
  if (!API_KEY) {
    console.warn("[email] BREVO_API_KEY not set — skipping email send");
    return;
  }

  await axios.post(
    BREVO_API_URL,
    {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to.email, name: to.name ?? to.email }],
      subject,
      htmlContent,
    },
    {
      headers: {
        "api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );
}


export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
): Promise<void> {
  const url = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;

  const html = emailWrapper(`
    <h2 style="margin:0 0 10px;font-size:26px;font-weight:700;color:${COLOR.oliveHeading};">
      Verify Your Email Address
    </h2>
    <p style="margin:0 0 28px;color:${COLOR.textMid};font-size:15px;line-height:1.8;">
      Hi <strong>${name}</strong>,<br/>
      Welcome to LotusMart! You're just one step away. Click the button below
      to verify your email address and activate your account.
    </p>
    <div style="text-align:center;margin:36px 0;">
      <a href="${url}" style="${btnStyle}">Verify Email Address</a>
    </div>
    <p style="margin:28px 0 0;font-size:13px;color:${COLOR.textMuted};line-height:1.7;">
      This link expires in <strong>24 hours</strong>. If you didn't create a
      LotusMart account, you can safely ignore this email.
    </p>
  `);

  await sendEmail({ email, name }, "Verify your LotusMart account", html);
}


export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
): Promise<void> {
  const url = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  const html = emailWrapper(`
    <h2 style="margin:0 0 10px;font-size:26px;font-weight:700;color:${COLOR.oliveHeading};">
      Reset Your Password
    </h2>
    <p style="margin:0 0 28px;color:${COLOR.textMid};font-size:15px;line-height:1.8;">
      Hi <strong>${name}</strong>,<br/>
      We received a request to reset the password for your LotusMart account.
      Click the button below to choose a new password.
    </p>
    <div style="text-align:center;margin:36px 0;">
      <a href="${url}" style="${btnStyle}">Reset My Password</a>
    </div>
    <div style="background:#FFF3CD;border:1px solid #FFE18A;border-radius:8px;
                padding:16px 20px;margin-top:28px;">
      <p style="margin:0;font-size:13px;color:#856404;line-height:1.7;">
        This link expires in <strong>1 hour</strong>. If you didn't request a
        password reset, please ignore this email — your password will not change.
      </p>
    </div>
  `);

  await sendEmail({ email, name }, "Reset your LotusMart password", html);
}


export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const html = emailWrapper(`
    <div style="text-align:center;margin-bottom:36px;">
      <div style="font-size:56px;line-height:1;margin-bottom:16px;">🌸</div>
      <h2 style="margin:0 0 10px;font-size:28px;font-weight:700;color:${COLOR.oliveHeading};">
        Welcome to LotusMart!
      </h2>
      <p style="margin:0;color:${COLOR.textMid};font-size:16px;line-height:1.7;">
        Hi <strong>${name}</strong>, your account is now active.<br/>
        Explore our curated range of premium spices and dry fruits.
      </p>
    </div>

    <!-- Feature highlights -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td width="33%" style="padding:16px;text-align:center;vertical-align:top;">
          <div style="font-size:16px;font-weight:700;margin-bottom:8px;color:${COLOR.rose};">*</div>
          <p style="margin:0;font-size:13px;font-weight:600;color:${COLOR.oliveHeading};">Premium Spices</p>
          <p style="margin:4px 0 0;font-size:12px;color:${COLOR.textMuted};">Sourced from farms</p>
        </td>
        <td width="33%" style="padding:16px;text-align:center;vertical-align:top;">
          <div style="font-size:16px;font-weight:700;margin-bottom:8px;color:${COLOR.rose};">*</div>
          <p style="margin:0;font-size:13px;font-weight:600;color:${COLOR.oliveHeading};">Dry Fruits</p>
          <p style="margin:4px 0 0;font-size:12px;color:${COLOR.textMuted};">Handpicked &amp; fresh</p>
        </td>
        <td width="33%" style="padding:16px;text-align:center;vertical-align:top;">
          <div style="font-size:16px;font-weight:700;margin-bottom:8px;color:${COLOR.rose};">*</div>
          <p style="margin:0;font-size:13px;font-weight:600;color:${COLOR.oliveHeading};">Fast Delivery</p>
          <p style="margin:4px 0 0;font-size:12px;color:${COLOR.textMuted};">Pan-India shipping</p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin:8px 0 0;">
      <a href="${APP_URL}/products" style="${btnStyle}">Start Shopping</a>
    </div>
  `);

  await sendEmail({ email, name }, "Welcome to LotusMart — your account is active!", html);
}


interface OrderConfirmationData {
  orderNumber: string;
  items: Array<Pick<IOrderItem, "name" | "quantity" | "price" | "image"> & { variant?: string }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: Pick<IAddress, "fullName" | "phone" | "addressLine1" | "addressLine2" | "city" | "state" | "pincode">;
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  order: OrderConfirmationData,
): Promise<void> {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${COLOR.creamBorder};
                   font-size:14px;color:${COLOR.textDark};line-height:1.5;">
          <strong>${item.name}</strong>
          ${item.variant ? `<br/><span style="font-size:12px;color:${COLOR.textMuted};">${item.variant}</span>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${COLOR.creamBorder};
                   font-size:14px;color:${COLOR.textMid};text-align:center;">×${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid ${COLOR.creamBorder};
                   font-size:14px;color:${COLOR.textDark};text-align:right;font-weight:500;">
          ₹${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`,
    )
    .join("");

  const addr = order.shippingAddress;
  const addressLines = [
    addr.addressLine1,
    addr.addressLine2,
    `${addr.city}, ${addr.state} — ${addr.pincode}`,
  ]
    .filter(Boolean)
    .join("<br/>");

  const html = emailWrapper(`
    <h2 style="margin:0 0 6px;font-size:26px;font-weight:700;color:${COLOR.oliveHeading};">
      Order Confirmed
    </h2>
    <p style="margin:0 0 28px;color:${COLOR.textMid};font-size:15px;line-height:1.7;">
      Hi <strong>${name}</strong>, thank you for your order! We're getting it ready.
    </p>

    <!-- Order number badge -->
    <div style="background:#FFF9E8;border:1px solid #FFE3B3;border-radius:10px;
                padding:18px 24px;margin-bottom:32px;display:inline-block;width:100%;">
      <p style="${labelStyle}">Order Number</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:${COLOR.oliveHeading};">
        ${order.orderNumber}
      </p>
    </div>

    <!-- Items table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <thead>
        <tr>
          <th style="text-align:left;${labelStyle}padding-bottom:10px;">Item</th>
          <th style="text-align:center;${labelStyle}padding-bottom:10px;">Qty</th>
          <th style="text-align:right;${labelStyle}padding-bottom:10px;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Totals breakdown -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="margin:16px 0 28px;border-top:2px solid ${COLOR.creamBorder};">
      <tr>
        <td style="padding:10px 0 4px;font-size:14px;color:${COLOR.textMid};">Subtotal</td>
        <td style="padding:10px 0 4px;font-size:14px;color:${COLOR.textDark};text-align:right;">
          ₹${order.subtotal.toFixed(2)}
        </td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;color:${COLOR.textMid};">Shipping</td>
        <td style="padding:4px 0;font-size:14px;color:${COLOR.textDark};text-align:right;">
          ${order.shippingCost === 0 ? '<span style="color:#22C55E;font-weight:500;">FREE</span>' : `₹${order.shippingCost.toFixed(2)}`}
        </td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;color:${COLOR.textMid};">Tax (GST)</td>
        <td style="padding:4px 0;font-size:14px;color:${COLOR.textDark};text-align:right;">
          ₹${order.tax.toFixed(2)}
        </td>
      </tr>
      <tr>
        <td style="padding:14px 0 0;font-size:17px;font-weight:700;color:${COLOR.textDark};
                   border-top:2px solid ${COLOR.creamBorder};">Total</td>
        <td style="padding:14px 0 0;font-size:17px;font-weight:700;color:${COLOR.rose};
                   text-align:right;border-top:2px solid ${COLOR.creamBorder};">
          ₹${order.total.toFixed(2)}
        </td>
      </tr>
    </table>

    <!-- Shipping address block -->
    <div style="background:#F7F6F0;border-radius:10px;padding:20px 24px;margin-bottom:32px;">
      <p style="${labelStyle}margin-bottom:10px;">Delivering To</p>
      <p style="margin:0;font-size:14px;font-weight:600;color:${COLOR.textDark};line-height:1.7;">
        ${addr.fullName}
      </p>
      <p style="margin:4px 0 0;font-size:14px;color:${COLOR.textMid};line-height:1.7;">
        ${addressLines}
      </p>
      <p style="margin:4px 0 0;font-size:13px;color:${COLOR.textMuted};">${addr.phone}</p>
    </div>

    <div style="text-align:center;">
      <a href="${APP_URL}/orders" style="${btnStyle}">Track Your Order</a>
    </div>
  `);

  await sendEmail(
    { email, name },
    `Order Confirmed — ${order.orderNumber}`,
    html,
  );
}


export async function sendShippingUpdateEmail(
  email: string,
  name: string,
  orderNumber: string,
  status: string,
  trackingNumber?: string,
): Promise<void> {
  const html = emailWrapper(`
    <h2 style="margin:0 0 10px;font-size:26px;font-weight:700;color:${COLOR.oliveHeading};">
      Shipping Update
    </h2>
    <p style="margin:0 0 28px;color:${COLOR.textMid};font-size:15px;line-height:1.8;">
      Hi <strong>${name}</strong>, here's the latest update on your order
      <strong>${orderNumber}</strong>.
    </p>

    <!-- Status badge -->
    <div style="background:#FFF9E8;border:2px solid ${COLOR.rose};border-radius:12px;
                padding:28px 24px;text-align:center;margin-bottom:28px;">
      <p style="${labelStyle}margin-bottom:8px;">Current Status</p>
      <p style="margin:0;font-size:26px;font-weight:700;color:${COLOR.rose};
                text-transform:uppercase;letter-spacing:1px;">
        ${status}
      </p>
      ${
        trackingNumber
          ? `<p style="margin:14px 0 0;font-size:14px;color:${COLOR.textMid};">
               Tracking Number: <strong style="color:${COLOR.oliveHeading};">${trackingNumber}</strong>
             </p>`
          : ""
      }
    </div>

    ${
      trackingNumber
        ? `<div style="background:${COLOR.creamBorder};border-radius:8px;padding:16px 20px;
                       margin-bottom:28px;text-align:center;">
             <p style="margin:0;font-size:13px;color:${COLOR.textMuted};">
               Use your tracking number to get real-time updates from the carrier.
             </p>
           </div>`
        : ""
    }

    <div style="text-align:center;">
      <a href="${APP_URL}/orders" style="${btnStyle}">View Order Details</a>
    </div>
  `);

  await sendEmail(
    { email, name },
    `Your order ${orderNumber} — ${status}`,
    html,
  );
}


interface AdminOrderAlert {
  orderNumber: string;
  total: number;
  itemCount: number;
  customerName: string;
  paymentMethod: string;
}

export async function sendAdminNewOrderAlert(order: AdminOrderAlert): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[email] ADMIN_EMAIL not set — skipping admin alert");
    return;
  }

  const methodLabel = order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)";

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${COLOR.oliveHeading};">
      New Order Received
    </h2>
    <p style="margin:0 0 28px;color:${COLOR.textMid};font-size:14px;">
      A new order has been placed on LotusMart.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#F7F6F0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid ${COLOR.creamBorder};">
          <p style="${labelStyle}">Order Number</p>
          <p style="${valueStyle}">${order.orderNumber}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid ${COLOR.creamBorder};">
          <p style="${labelStyle}">Customer</p>
          <p style="${valueStyle}">${order.customerName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid ${COLOR.creamBorder};">
          <p style="${labelStyle}">Items</p>
          <p style="${valueStyle}">${order.itemCount} item${order.itemCount !== 1 ? "s" : ""}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid ${COLOR.creamBorder};">
          <p style="${labelStyle}">Payment Method</p>
          <p style="${valueStyle}">${methodLabel}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;">
          <p style="${labelStyle}">Order Total</p>
          <p style="margin:0;font-size:24px;font-weight:700;color:${COLOR.rose};">
            ₹${order.total.toFixed(2)}
          </p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      <a href="${APP_URL}/admin/orders" style="${btnStyle}">View in Admin Panel</a>
    </div>
  `);

  await sendEmail(
    { email: adminEmail, name: "LotusMart Admin" },
    `New Order: ${order.orderNumber} — ₹${order.total.toFixed(2)}`,
    html,
  );
}


export const sendOrderConfirmation = sendOrderConfirmationEmail;


export const sendShippingUpdate = sendShippingUpdateEmail;
