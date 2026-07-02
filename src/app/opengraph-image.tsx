import { ImageResponse } from "next/og";

// Image d'aperçu affichée quand on partage le lien (WhatsApp, réseaux, etc.).
// Juste le « J » du logo, centré, aux couleurs de Jàng — aucune image externe à héberger.
export const alt = "Jàng — La plateforme scolaire des écoles du Sénégal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            fontSize: "420px",
            fontWeight: 800,
            letterSpacing: "-12px",
            color: "#22c55e",
            lineHeight: 1,
          }}
        >
          J
        </span>
      </div>
    ),
    { ...size }
  );
}
