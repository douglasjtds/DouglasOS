"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDisplayStore } from "@/lib/store/displayStore";
import { useWindowStore } from "@/lib/store/windowStore";
import { useAnimatedWallpaperBlocker } from "@/hooks/useAnimatedWallpaperBlocker";
import { SCENE_COLORS } from "@/components/os/desktop/sceneColors";
import {
  SWATCH_IDS,
  WALLPAPER_IDS,
  WALLPAPER_IMAGES,
  swatchVar,
  type DisplaySettings,
} from "@/lib/wallpapers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Small monitor showing the draft wallpaper (decorative; labelled as an image). */
function MonitorPreview({ draft, label }: { draft: DisplaySettings; label: string }) {
  const image = WALLPAPER_IMAGES[draft.wallpaper];
  const color =
    draft.wallpaper === "solid"
      ? swatchVar(draft.swatch)
      : draft.wallpaper === "3d"
        ? SCENE_COLORS.base
        : "var(--color-desktop)";
  return (
    <div role="img" aria-label={label} className="flex flex-col items-center">
      <div className="rounded-button border border-bevel-dark bg-button-face p-2 shadow-bevel-raised">
        <div
          data-preview={draft.wallpaper}
          className="h-[108px] w-[152px] border border-bevel-dark bg-cover bg-bottom"
          style={{ backgroundColor: color, backgroundImage: image ? `url(${image})` : undefined }}
        >
          {draft.wallpaper === "3d" && (
            <div
              className="size-full"
              style={{
                backgroundImage: `radial-gradient(${SCENE_COLORS.primary} 1px, transparent 1.5px)`,
                backgroundSize: "14px 12px",
              }}
            />
          )}
        </div>
      </div>
      <div className="h-2 w-10 border-x border-bevel-dark bg-bevel-shadow" />
      <div className="h-1.5 w-20 rounded-t-button border border-bevel-dark bg-button-face" />
    </div>
  );
}

/**
 * Display Properties (DESKTOP-INTERFACE-SPEC §8): pick a wallpaper — three
 * original static ones, a solid color or the optional animated 3D scene.
 * Choices are a draft until Apply/OK; Cancel discards. The Screen Saver tab is
 * intentionally omitted (no dead tabs).
 */
export default function DisplayApp() {
  const t = useTranslations("apps.display");
  const savedWallpaper = useDisplayStore((s) => s.wallpaper);
  const savedSwatch = useDisplayStore((s) => s.swatch);
  const applyDisplay = useDisplayStore((s) => s.applyDisplay);
  const blocker = useAnimatedWallpaperBlocker();
  const [draft, setDraft] = useState<DisplaySettings>({
    wallpaper: savedWallpaper,
    swatch: savedSwatch,
  });

  const dirty = draft.wallpaper !== savedWallpaper || draft.swatch !== savedSwatch;
  const close = () => useWindowStore.getState().closeWindow("display");

  return (
    <div className="flex h-full flex-col gap-2 text-system">
      <Tabs defaultValue="desktop" className="flex min-h-0 flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="desktop">{t("tabs.desktop")}</TabsTrigger>
        </TabsList>
        <TabsContent value="desktop" className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
          <MonitorPreview draft={draft} label={t("preview")} />

          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1">{t("wallpaperLabel")}</legend>
            <div className="flex flex-col border border-field-border bg-surface">
              {WALLPAPER_IDS.map((id) => {
                const disabled = id === "3d" && blocker !== null;
                const checked = draft.wallpaper === id;
                return (
                  <label
                    key={id}
                    className={cn(
                      "flex cursor-default items-center gap-2 px-1.5 py-0.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-dotted has-[:focus-visible]:-outline-offset-1",
                      checked && "bg-highlight text-highlight-text",
                      disabled && "text-text-disabled",
                    )}
                  >
                    <input
                      type="radio"
                      name="wallpaper"
                      value={id}
                      data-wallpaper-option={id}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => setDraft((d) => ({ ...d, wallpaper: id }))}
                      className="sr-only"
                    />
                    {t(`wallpapers.${id}`)}
                  </label>
                );
              })}
            </div>
            {blocker ? (
              <p className="text-text-muted">{t(`unavailable.${blocker}`)}</p>
            ) : (
              draft.wallpaper === "3d" && <p className="text-text-muted">{t("animatedNote")}</p>
            )}
          </fieldset>

          {draft.wallpaper === "solid" && (
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1">{t("colorLabel")}</legend>
              <div className="flex gap-1.5">
                {SWATCH_IDS.map((id) => (
                  <label
                    key={id}
                    title={t(`swatches.${id}`)}
                    className={cn(
                      "size-7 cursor-default border-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring",
                      draft.swatch === id ? "border-highlight" : "border-surface",
                    )}
                    style={{ backgroundColor: swatchVar(id) }}
                  >
                    <input
                      type="radio"
                      name="swatch"
                      value={id}
                      aria-label={t(`swatches.${id}`)}
                      checked={draft.swatch === id}
                      onChange={() => setDraft((d) => ({ ...d, swatch: id }))}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-1.5">
        <Button
          variant="primary"
          data-display-ok
          onClick={() => {
            applyDisplay(draft);
            close();
          }}
        >
          {t("ok")}
        </Button>
        <Button onClick={close}>{t("cancel")}</Button>
        <Button disabled={!dirty} onClick={() => applyDisplay(draft)}>
          {t("apply")}
        </Button>
      </div>
    </div>
  );
}
