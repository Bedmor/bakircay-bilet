import { randomUUID } from "node:crypto";

const pad = (value: number, size: number) => value.toString().padStart(size, "0");

export const generateTicketNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1, 2);
  const day = pad(now.getDate(), 2);
  const suffix = randomUUID().split("-")[0]?.toUpperCase() ?? "00000000";

  return `BKR-${year}${month}${day}-${suffix}`;
};
