import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const alt = "DouglasOS — Douglas Tertuliano, AI-First Fullstack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OG card: dark base with the DouglasOS wordmark + name/headline in brand tokens. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "apps.about" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          backgroundColor: "#0a0a0f",
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(0,217,255,0.10), transparent), radial-gradient(ellipse 50% 40% at 85% 100%, rgba(124,58,237,0.12), transparent)",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>
          <span style={{ color: "#f5f5f7" }}>Douglas</span>
          <span style={{ color: "#00d9ff" }}>OS</span>
        </div>
        <div
          style={{
            width: 220,
            height: 4,
            borderRadius: 9999,
            backgroundColor: "#00d9ff",
            boxShadow: "0 0 24px rgba(0,217,255,0.4)",
          }}
        />
        <div style={{ display: "flex", fontSize: 34, color: "#c7c7cc" }}>
          {t("name")} — {t("headline")}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#8a8a93" }}>
          {t("location")}
        </div>
      </div>
    ),
    size,
  );
}
