"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 240 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: "M" })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size]);
  if (!src) return <div style={{ width: size, height: size }} className="animate-pulse rounded-xl bg-paper" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt="Solana Pay QR code" className="rounded-xl" />;
}
