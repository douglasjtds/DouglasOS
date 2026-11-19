"use client";

import { useState, type ComponentType } from "react";
import Image from "next/image";
import type { AssistantState } from "@/lib/store/assistantStore";
import {
  ASSISTANT_MEDIA,
  clipForState,
  clipSource,
  pickMediaFormat,
  type MediaFormat,
} from "@/lib/assistant/media";
import { PlaceholderCharacter } from "@/components/os/assistant/PlaceholderCharacter";

/** What every character renderer receives (placeholder and recorded clips alike). */
export interface CharacterRendererProps {
  state: AssistantState;
  /** Static frame only: no loops, no dance moves. */
  reducedMotion: boolean;
}

function detectFormat(): MediaFormat {
  const probe = document.createElement("video");
  return pickMediaFormat({
    userAgent: navigator.userAgent,
    canPlayWebm: probe.canPlayType('video/webm; codecs="vp9"') !== "",
    canPlayHevc: probe.canPlayType('video/mp4; codecs="hvc1"') !== "",
  });
}

function Poster() {
  return (
    <Image
      src={ASSISTANT_MEDIA.poster}
      alt=""
      width={240}
      height={280}
      unoptimized
      draggable={false}
      className="size-full object-contain"
    />
  );
}

/**
 * The recorded clips (ASSISTANT-ASSETS.md): one looping, muted, inline video
 * per state, in the format this browser renders with transparency. Reduced
 * motion, an unsupported browser or a failed load fall back to the poster.
 */
function VideoCharacter({ state, reducedMotion }: CharacterRendererProps) {
  const [format] = useState(detectFormat);
  const [failed, setFailed] = useState(false);
  if (reducedMotion || format === "poster" || failed) return <Poster />;
  const source = clipSource(clipForState(state), format);
  return (
    <video
      key={source.src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster={ASSISTANT_MEDIA.poster}
      onError={() => setFailed(true)}
      className="size-full object-contain"
    >
      <source src={source.src} type={source.type} onError={() => setFailed(true)} />
    </video>
  );
}

const Renderer: ComponentType<CharacterRendererProps> = ASSISTANT_MEDIA.ready
  ? VideoCharacter
  : PlaceholderCharacter;

/**
 * mini Douglas himself — one interface over the asset contract. Purely
 * visual (`aria-hidden` lives on the renderers); the clickable button and its
 * label are owned by `Assistant`.
 */
export function AssistantCharacter(props: CharacterRendererProps) {
  return (
    <span aria-hidden className="block size-full" data-character-state={props.state}>
      <Renderer {...props} />
    </span>
  );
}
