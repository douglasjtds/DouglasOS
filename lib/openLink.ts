/**
 * Follow an external shortcut (client-only). External URLs open in a new tab
 * with `rel="noopener noreferrer"` (no `window.opener`, no referrer leak);
 * `mailto:` and other in-place links are followed without a target, which
 * hands off to the mail app and leaves the desktop where it is.
 */
export function openLink(href: string, external: boolean): void {
  const a = document.createElement("a");
  a.href = href;
  if (external) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  document.body.appendChild(a);
  a.click();
  a.remove();
}
