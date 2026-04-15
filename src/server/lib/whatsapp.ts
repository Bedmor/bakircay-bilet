import { env } from "~/env";

const DEFAULT_PAYMENT_NUMBER = "905551112233";

export const buildWhatsappPaymentLink = (params: {
  purchaseId: string;
  quantity: number;
  totalKurus: number;
  ticketNumbers: string[];
}) => {
  const paymentNumber = env.WHATSAPP_PAYMENT_NUMBER ?? DEFAULT_PAYMENT_NUMBER;
  const totalTl = params.totalKurus.toFixed(2);
  const ticketList = params.ticketNumbers.join(", ");

  const message = [
    "Merhaba, bilet odemesi yapmak istiyorum.",
    `Siparis No: ${params.purchaseId}`,
    `Adet: ${params.quantity}`,
    `Toplam: ${totalTl} TL`,
    `Bilet Numaralari: ${ticketList}`,
  ].join("\n");

  return `https://wa.me/${paymentNumber}?text=${encodeURIComponent(message)}`;
};
