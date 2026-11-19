import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { THEME_HEX as C } from "@/lib/theme";

export const alt = "DouglasOS — Douglas Tertuliano, AI-First Fullstack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG card in the DouglasOS identity: a blue desktop with the "Morning Waves"
 * ribbons (the default wallpaper), one
 * Luna window introducing Douglas, and the taskbar with the green Start
 * button. All original shapes (no OS artwork); colors from lib/theme.ts.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "apps.about" });
  const tb = await getTranslations({ locale, namespace: "taskbar" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.desktop,
          backgroundImage: `linear-gradient(135deg, #062f7e, #1450b8 42%, #2f7ce0 72%, #7fc0f5)`,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Wallpaper ribbons (mirrors public/wallpapers/morning-waves.svg) */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <path d="M0 373 C 238 303 475 443 725 373 S 1063 245 1200 274 V 630 H 0 Z" fill="#a8dcff" fillOpacity="0.55" />
          <path d="M0 443 C 263 385 513 513 775 449 S 1088 344 1200 373 V 630 H 0 Z" fill="#2f7ce0" />
          <path d="M0 443 C 263 385 513 513 775 449 S 1088 344 1200 373" fill="none" stroke="#7ed957" strokeWidth="5" />
          <path d="M0 525 C 288 478 538 583 813 531 S 1113 461 1200 478 V 630 H 0 Z" fill="#0e47a6" />
        </svg>

        {/* Window */}
        <div
          style={{
            position: "absolute",
            left: 190,
            top: 90,
            width: 820,
            height: 370,
            display: "flex",
            flexDirection: "column",
            border: `5px solid ${C.titlebar}`,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            backgroundColor: C.buttonFace,
            boxShadow: "6px 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              height: 58,
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              backgroundImage: `linear-gradient(to bottom, ${C.titlebarHighlight}, ${C.titlebar} 20%, ${C.titlebar} 85%, #003dd7)`,
              color: C.textInverse,
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            DouglasOS
          </div>
          <div
            style={{
              flex: 1,
              margin: 10,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 16,
              padding: "0 40px",
              backgroundColor: C.surface,
              border: "2px solid #7f9db9",
            }}
          >
            <div style={{ display: "flex", fontSize: 62, fontWeight: 700, color: C.text }}>
              {t("name")}
            </div>
            <div style={{ display: "flex", fontSize: 34, color: C.text }}>{t("headline")}</div>
            <div style={{ display: "flex", fontSize: 24, color: "#5c5c5c" }}>{t("location")}</div>
          </div>
        </div>

        {/* Taskbar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: 56,
            display: "flex",
            alignItems: "center",
            backgroundImage: `linear-gradient(to bottom, ${C.taskbarHighlight}, ${C.taskbar} 20%, ${C.taskbar} 85%, ${C.taskbarShadow})`,
          }}
        >
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              padding: "0 40px 0 22px",
              borderTopRightRadius: 22,
              borderBottomRightRadius: 22,
              backgroundImage: `linear-gradient(to bottom, ${C.startHighlight}, ${C.start} 35%, ${C.start} 80%, #1e5e22)`,
              color: C.textInverse,
              fontSize: 30,
              fontWeight: 700,
              fontStyle: "italic",
            }}
          >
            {tb("start")}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
