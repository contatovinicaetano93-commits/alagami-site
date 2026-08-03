import { ImageResponse } from "next/og";

/** Compat: metadata antiga aponta para /og-image.png */
export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(145deg, #0C1A3D 0%, #132A63 55%, #1B4FD8 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid #4ADE80",
              borderRadius: 10,
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              padding: 6,
            }}
          >
            {[1, 0, 1, 0, 1, 0, 1, 0, 1].map((on, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  background: on ? "#4ADE80" : "transparent",
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: 2 }}>IMOBI</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
            Crédito para sua obra em dias.
          </div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.78)", maxWidth: 820 }}>
            Análise desburocratizada · documentação simplificada · liberação por etapa
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#4ADE80", fontWeight: 700 }}>
          imobi-web-ten.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
