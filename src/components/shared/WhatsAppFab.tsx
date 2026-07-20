import { RiWhatsappFill } from "react-icons/ri";

// Business WhatsApp number (India). Kept in sync with the mobile app FAB.
const WHATSAPP_PHONE = "919826040276";
const DEFAULT_MESSAGE = "Hi! I have a question about LotusMart products.";

interface WhatsAppFabProps {
  phone?: string;
  message?: string;
}

/**
 * Floating WhatsApp chat button, bottom-right. Mounted in the (public) layout,
 * so it never appears on /admin. It sits above the mobile bottom nav and below
 * modals (z-40). Plain anchor — deep-links into WhatsApp on mobile and opens
 * web.whatsapp.com on desktop.
 */
export function WhatsAppFab({
  phone = WHATSAPP_PHONE,
  message = DEFAULT_MESSAGE,
}: WhatsAppFabProps) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-4 bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 sm:right-6 lg:bottom-6"
      style={{ backgroundColor: "#25D366" }}
    >
      <RiWhatsappFill size={30} />
    </a>
  );
}

export default WhatsAppFab;
