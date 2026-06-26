import { ImageResponse } from "next/og";

// Image d'aperçu affichée quand on partage le lien (WhatsApp, réseaux, etc.).
// Générée à la volée, aux couleurs de Jàng — aucune image externe à héberger.
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
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "24px",
              background: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "64px",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            J
          </div>
          <span style={{ fontSize: "92px", fontWeight: 800, letterSpacing: "-2px" }}>
            Jàng
          </span>
        </div>

        <div
          style={{
            marginTop: "40px",
            fontSize: "44px",
            fontWeight: 600,
            lineHeight: 1.25,
            maxWidth: "900px",
          }}
        >
          La vie scolaire de votre établissement, simplifiée.
        </div>

        <div style={{ marginTop: "28px", fontSize: "30px", color: "#cbd5e1" }}>
          Notes · Bulletins · Emploi du temps · Devoirs · Absences · Messagerie
        </div>

        <div style={{ marginTop: "auto", fontSize: "26px", color: "#94a3b8" }}>
          Plateforme scolaire · Sénégal · mobile-first
        </div>
      </div>
    ),
    { ...size }
  );
}
