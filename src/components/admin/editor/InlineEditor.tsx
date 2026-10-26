"use client";

/* eslint-disable @next/next/no-img-element -- admin thumbnails of arbitrary uploads */
import { Component, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { discardDrafts, publishSite, saveDrafts } from "@/app/admin/actions";
import { contentPages, type ContentKey, type ContentMap } from "@/content/registry";
import { blankOf, itemTemplate } from "@/lib/content/merge";
import { decodeIds, hasMarker } from "@/lib/stega";
import { EditingContext } from "@/components/editing-context";
import { SiteChrome } from "@/views/SiteChrome";
import { MediaLibrary } from "../MediaLibrary";
import { ACCEPT_ATTR, uploadImage, type MediaItem } from "../media";
import { GraphicPicker } from "./GraphicPicker";
import { AdminButton, ConfirmDialog, Toast } from "../ui";
import { encodeDocs, sourceOfImg } from "./encode";
import { DocumentForm } from "./FieldForm";
import { describePath, humanise, isLongText } from "./labels";
import { EDITABLE_PAGES, findPage, pageForPath, renderPage } from "./pages";
import { getAt, isRecord, nearestList, setAt, type FieldRef, type Path } from "./paths";

type Target =
  | { kind: "text"; ref: FieldRef; anchor: Text | Element }
  | { kind: "image"; ref: FieldRef; anchor: Element }
  | { kind: "graphic"; ref: FieldRef; anchor: Element };

type SaveState = "saved" | "saving" | "unsaved" | "error";

const AUTOSAVE_MS = 1200;

/* ---------- hit testing ---------- */

function caretNode(x: number, y: number): Node | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  if (doc.caretPositionFromPoint) return doc.caretPositionFromPoint(x, y)?.offsetNode ?? null;
  if (doc.caretRangeFromPoint) return doc.caretRangeFromPoint(x, y)?.startContainer ?? null;
  return null;
}

function rectOf(anchor: Text | Element): DOMRect {
  if (anchor.nodeType === Node.TEXT_NODE) {
    const range = document.createRange();
    range.selectNodeContents(anchor);
    return range.getBoundingClientRect();
  }
  return (anchor as Element).getBoundingClientRect();
}

function pointIn(rect: DOMRect, x: number, y: number, pad = 2) {
  return x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad;
}

/* ---------- crash guard ---------- */

/** Keeps the editor usable if a section can't render the current content. */
class CanvasBoundary extends Component<{ children: ReactNode; resetKey: number }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { resetKey: number }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto my-24 max-w-xl border border-grey-200 bg-paper p-8 font-sans">
        <p className="font-serif text-2xl">This page couldn’t be shown with the latest change.</p>
        <p className="mt-3 text-grey-600">
          Undo your last edit in “All settings” (for example, fill in a field you emptied), or press Discard. Your
          live website is not affected.
        </p>
      </div>
    );
  }
}

/* ---------- component ---------- */

export function InlineEditor({
  pageId,
  initialDocs,
  initialUnpublished,
}: {
  pageId: string;
  initialDocs: ContentMap;
  initialUnpublished: ContentKey[];
}) {
  const page = findPage(pageId) ?? EDITABLE_PAGES[0];
  const canvasRef = useRef<HTMLDivElement>(null);

  const [docs, setDocs] = useState<ContentMap>(initialDocs);
  const [unpublished, setUnpublished] = useState<Set<ContentKey>>(new Set(initialUnpublished));
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [hover, setHover] = useState<{ rect: DOMRect; label: string } | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [tracked, setTracked] = useState<{ target: Target; rect: DOMRect } | null>(null);
  const [preview, setPreview] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelDoc, setPanelDoc] = useState<ContentKey>(page.docs[0]);
  const [imageModal, setImageModal] = useState<(FieldRef & { mode: "image" | "graphic" }) | null>(null);
  const [graphicModal, setGraphicModal] = useState<FieldRef | null>(null);
  const [showEditable, setShowEditable] = useState(true);
  const [outlines, setOutlines] = useState<DOMRect[]>([]);
  const [dialog, setDialog] = useState<"publish" | "discard" | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "info" | "error" } | null>(null);
  const [showHelp, setShowHelp] = useState(true);

  const encoded = useMemo(() => encodeDocs(docs), [docs]);
  const [editCount, setEditCount] = useState(0);

  /* ----- editing ----- */

  const lastSaved = useRef<Record<string, string>>(
    Object.fromEntries(Object.entries(initialDocs).map(([k, v]) => [k, JSON.stringify(v)])),
  );

  const update = useCallback((doc: ContentKey, path: Path, value: unknown) => {
    setDocs((prev) => {
      let next = setAt(prev, [doc, ...path], value);
      // Keep the phone link in step with the phone number.
      if (doc === "site" && path.join(".") === "contact.phone" && typeof value === "string") {
        next = setAt(next, ["site", "contact", "phoneHref"], `tel:${value.replace(/[^\d+]/g, "")}`);
      }
      return next;
    });
    setEditCount((n) => n + 1);
    setSaveState("unsaved");
  }, []);

  const flash = useCallback((message: string, tone: "info" | "error" = "info") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    const changes = (Object.keys(docs) as ContentKey[])
      .filter((key) => JSON.stringify(docs[key]) !== lastSaved.current[key])
      .map((key) => ({ key, data: docs[key] }));
    if (changes.length === 0) {
      setSaveState("saved");
      return true;
    }
    setSaveState("saving");
    const result = await saveDrafts(changes);
    if (!result.ok) {
      setSaveState("error");
      flash(result.error, "error");
      return false;
    }
    for (const c of changes) lastSaved.current[c.key] = JSON.stringify(c.data);
    setUnpublished((prev) => new Set([...prev, ...changes.map((c) => c.key)]));
    setSaveState("saved");
    return true;
  }, [docs, flash]);

  // Autosave shortly after the admin stops typing.
  useEffect(() => {
    if (saveState !== "unsaved") return;
    const timer = setTimeout(() => void save(), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [docs, saveState, save]);

  // Warn before leaving with unsaved edits (unless we're leaving after saving).
  const unsavedRef = useRef(false);
  useEffect(() => {
    unsavedRef.current = saveState === "unsaved" || saveState === "saving";
  }, [saveState]);
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /** Saves, then opens another page in the editor with fresh drafts from the server. */
  const goToPage = useCallback(
    async (id: string) => {
      if (!(await save())) return;
      unsavedRef.current = false;
      // A full load (not router.push) so the next page starts from fresh server drafts.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/admin/edit/${id}`);
    },
    [save],
  );

  /* ----- finding what's under the pointer ----- */

  const locate = useCallback(
    (x: number, y: number, element: Element | null): Target | null => {
      const canvas = canvasRef.current;
      if (!canvas || !element || !canvas.contains(element)) return null;

      // Drawings and icons carry their field's marker in data-edit.
      const graphic = element.closest("[data-edit]");
      if (graphic && canvas.contains(graphic)) {
        const [id] = decodeIds(graphic.getAttribute("data-edit") ?? "");
        if (id !== undefined && encoded.fields[id]) return { kind: "graphic", ref: encoded.fields[id], anchor: graphic };
      }

      const img = element.closest("img");
      if (img && canvas.contains(img)) {
        const src = sourceOfImg(img);
        const image = encoded.images.find((i) => i.src === src || src.endsWith(i.src));
        if (image) return { kind: "image", ref: { doc: image.doc, path: image.path }, anchor: img };
      }

      const node = caretNode(x, y);
      if (node && node.nodeType === Node.TEXT_NODE && canvas.contains(node)) {
        const text = node as Text;
        const [id] = decodeIds(text.data);
        if (id !== undefined && encoded.fields[id] && pointIn(rectOf(text), x, y)) {
          return { kind: "text", ref: encoded.fields[id], anchor: text };
        }
      }

      // Fallback (SVG text, tight inline elements): an element with exactly one marked text child.
      for (let el: Element | null = element, depth = 0; el && el !== canvas && depth < 4; el = el.parentElement, depth++) {
        const marked = Array.from(el.childNodes).filter(
          (n): n is Text => n.nodeType === Node.TEXT_NODE && hasMarker((n as Text).data),
        );
        if (marked.length === 1) {
          const [id] = decodeIds(marked[0].data);
          if (encoded.fields[id]) return { kind: "text", ref: encoded.fields[id], anchor: el };
        }
        if (marked.length > 1) break;
      }
      return null;
    },
    [encoded],
  );

  function onPointerMove(e: React.PointerEvent) {
    if (preview) return;
    const found = locate(e.clientX, e.clientY, e.target as Element);
    if (!found) return setHover(null);
    const rect = rectOf(found.anchor);
    const label =
      found.kind === "image"
        ? "Image: click to replace"
        : found.kind === "graphic"
          ? "Drawing: click to change"
          : describePath(found.ref.path);
    setHover({ rect, label });
  }

  function onClickCapture(e: React.MouseEvent) {
    const anchor = (e.target as Element).closest("a");
    if (preview) {
      // In preview, internal links move between pages inside the editor.
      if (anchor) {
        e.preventDefault();
        const url = new URL(anchor.href, window.location.href);
        const next = url.origin === window.location.origin ? pageForPath(url.pathname) : undefined;
        if (next) void goToPage(next.id);
        else if (url.origin !== window.location.origin) window.open(url.href, "_blank", "noopener");
      }
      return;
    }
    // Menu toggles (e.g. the mobile ☰ button) keep working, so their contents can be edited too.
    const toggle = (e.target as Element).closest("button[aria-controls]");
    const found = locate(e.clientX, e.clientY, e.target as Element);
    if (toggle && !found) {
      setTarget(null);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setTarget(found);
    setShowHelp(false);
  }

  // Keep the popover attached to its text while the page scrolls or re-renders.
  useLayoutEffect(() => {
    if (!target) return;
    let frame = 0;
    const track = () => {
      if (target.anchor.isConnected) setTracked({ target, rect: rectOf(target.anchor) });
      frame = requestAnimationFrame(track);
    };
    frame = requestAnimationFrame(track);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  const targetRect = tracked && tracked.target === target ? tracked.rect : null;
  const graphicRef: FieldRef | null = target?.kind === "graphic" ? target.ref : graphicModal;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTarget(null);
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  /* ----- publish / discard ----- */

  async function publish() {
    setBusy(true);
    const saved = await save();
    const result = saved ? await publishSite() : { ok: false as const, error: "Save your changes first." };
    setBusy(false);
    setDialog(null);
    if (result.ok) {
      setUnpublished(new Set());
      flash("Published. Your changes are live on the website.");
    } else {
      flash(result.error, "error");
    }
  }

  async function discard() {
    setBusy(true);
    const result = await discardDrafts();
    setBusy(false);
    setDialog(null);
    if (result.ok) {
      window.location.reload();
    } else {
      flash(result.error, "error");
    }
  }

  /* ----- images ----- */

  async function applyImage(ref: FieldRef & { mode?: "image" | "graphic" }, item: MediaItem) {
    if (ref.mode === "graphic") {
      update(ref.doc, ref.path, item.src);
    } else {
      const current = getAt(docs[ref.doc], ref.path) as Record<string, unknown>;
      update(ref.doc, ref.path, { ...current, src: item.src, width: item.width, height: item.height });
    }
    setImageModal(null);
  }

  /* ----- always-visible outlines around everything editable ----- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!showEditable || preview) return setOutlines([]);
      const rects: DOMRect[] = [];
      const vh = window.innerHeight;
      const keep = (r: DOMRect) => {
        if (r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < vh) rects.push(r);
      };
      const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node as Text;
        if (!hasMarker(text.data) || text.parentElement?.closest(".sr-only, [data-edit]")) continue;
        const range = document.createRange();
        range.selectNodeContents(text);
        keep(range.getBoundingClientRect());
      }
      canvas.querySelectorAll("[data-edit], img").forEach((el) => keep(el.getBoundingClientRect()));
      setOutlines(rects);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new MutationObserver(schedule);
    observer.observe(canvas, { subtree: true, childList: true, characterData: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [showEditable, preview, docs]);

  const changedTitles = contentPages.filter((p) => unpublished.has(p.key)).map((p) => p.title);
  const statusText = {
    saved: unpublished.size > 0 ? "Saved as draft · not live yet" : "All changes are live",
    saving: "Saving…",
    unsaved: "Unsaved changes…",
    error: "Couldn’t save. Check your connection.",
  }[saveState];

  return (
    <div className="relative">
      {/* The website itself, rendered with the draft content. */}
      <div
        ref={canvasRef}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(null)}
        onClickCapture={onClickCapture}
        onSubmitCapture={(e) => e.preventDefault()}
        className={preview ? "" : "editing [&_a]:cursor-text [&_button]:cursor-text [&_img]:cursor-pointer"}
      >
        <CanvasBoundary resetKey={editCount}>
          <EditingContext value={!preview}>
            <SiteChrome site={encoded.docs.site}>{renderPage(page.id, encoded.docs)}</SiteChrome>
          </EditingContext>
        </CanvasBoundary>
      </div>
      {/* Room to scroll the end of the page clear of the floating toolbar. */}
      <div aria-hidden="true" className="h-28 bg-ink" />

      {/* Hover outline */}
      {hover && !preview && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[60] outline-2 outline-offset-2 outline-amber outline-dashed"
          style={{ left: hover.rect.left, top: hover.rect.top, width: hover.rect.width, height: hover.rect.height }}
        >
          <span className="absolute -top-6 left-0 bg-amber px-2 py-0.5 font-sans text-[11px] whitespace-nowrap text-ink">
            {hover.label}
          </span>
        </div>
      )}

      {/* Inline text editor */}
      {target?.kind === "text" && targetRect && (
        <TextPopover
          key={`${target.ref.doc}:${target.ref.path.join(".")}`}
          rect={targetRect}
          docs={docs}
          refField={target.ref}
          onChange={(path, value) => update(target.ref.doc, path, value)}
          onClose={() => setTarget(null)}
        />
      )}

      {/* Image editor */}
      {target?.kind === "image" && targetRect && (
        <ImagePopover
          rect={targetRect}
          value={getAt(docs[target.ref.doc], target.ref.path) as { src: string; alt: string }}
          onAlt={(alt) => update(target.ref.doc, [...target.ref.path, "alt"], alt)}
          onUpload={async (file) => {
            try {
              await applyImage(target.ref, await uploadImage(file));
              flash("Image uploaded.");
            } catch (e) {
              flash((e as Error).message, "error");
            }
          }}
          onLibrary={() => setImageModal({ ...target.ref, mode: "image" })}
          onClose={() => setTarget(null)}
        />
      )}

      {/* Drawing / icon picker, from a click on the page or from the settings panel */}
      {graphicRef && (
        <GraphicPicker
          rect={target?.kind === "graphic" ? targetRect : null}
          fieldKey={String(graphicRef.path[graphicRef.path.length - 1])}
          value={String(getAt(docs[graphicRef.doc], graphicRef.path) ?? "")}
          onChange={(value) => update(graphicRef.doc, graphicRef.path, value)}
          onUpload={async (file) => {
            try {
              const item = await uploadImage(file);
              update(graphicRef.doc, graphicRef.path, item.src);
              flash("Image uploaded.");
            } catch (e) {
              flash((e as Error).message, "error");
            }
          }}
          onLibrary={() => setImageModal({ ...graphicRef, mode: "graphic" })}
          onClose={() => {
            setTarget(null);
            setGraphicModal(null);
          }}
        />
      )}

      {/* Dotted outlines so editable things are visible without hovering */}
      {outlines.map((r, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="pointer-events-none fixed z-[55] outline-1 outline-offset-2 outline-amber/70 outline-dotted"
          style={{ left: r.left, top: r.top, width: r.width, height: r.height }}
        />
      ))}

      {imageModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4" onClick={() => setImageModal(null)}>
          <div
            role="dialog"
            aria-label="Choose an image"
            className="max-h-[85vh] w-full max-w-4xl overflow-y-auto bg-paper p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl">Choose an image</h2>
              <AdminButton variant="ghost" size="sm" onClick={() => setImageModal(null)}>
                Close
              </AdminButton>
            </div>
            <MediaLibrary onPick={(item) => applyImage(imageModal, item)} />
          </div>
        </div>
      )}

      {/* Side panel with every field, including ones not visible on the page */}
      {panelOpen && (
        <aside className="fixed top-0 right-0 bottom-0 z-[70] flex w-[min(28rem,100vw)] flex-col border-l border-grey-200 bg-grey-50 font-sans shadow-2xl">
          <div className="flex items-center justify-between border-b border-grey-200 bg-paper px-5 py-4">
            <div>
              <p className="eyebrow text-grey-500">All settings</p>
              <p className="text-sm text-grey-600">Links, lists, images and search engine text.</p>
            </div>
            <AdminButton variant="ghost" size="sm" onClick={() => setPanelOpen(false)}>
              Close
            </AdminButton>
          </div>
          <div role="tablist" className="flex gap-1 border-b border-grey-200 bg-paper px-3">
            {page.docs.map((doc) => (
              <button
                key={doc}
                role="tab"
                aria-selected={panelDoc === doc}
                onClick={() => setPanelDoc(doc)}
                className={`border-b-2 px-3 py-2.5 text-sm ${panelDoc === doc ? "border-amber text-ink" : "border-transparent text-grey-600"}`}
              >
                {doc === "site" ? "Site-wide" : (contentPages.find((p) => p.key === doc)?.title ?? doc)}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <DocumentForm
              value={docs[panelDoc] as unknown as Record<string, unknown>}
              ctx={{
                root: docs[panelDoc],
                onChange: (path, value) => update(panelDoc, path, value),
                onEditImage: (path) => setImageModal({ doc: panelDoc, path, mode: "image" }),
                onEditGraphic: (path) => setGraphicModal({ doc: panelDoc, path }),
              }}
            />
          </div>
        </aside>
      )}

      {/* First-visit help */}
      {showHelp && !preview && (
        <div className="fixed top-20 left-1/2 z-[60] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 bg-ink p-5 font-sans text-paper shadow-2xl">
          <p className="font-serif text-xl">You’re editing the {page.title} page</p>
          <ul className="mt-3 space-y-1.5 text-sm text-grey-200">
            <li>• Click any text to change it. Click any image to replace it.</li>
            <li>• Use “All settings” for links, lists, menu items and search engine text.</li>
            <li>• Changes save automatically as a draft. Press “Publish” to make them live.</li>
          </ul>
          <button onClick={() => setShowHelp(false)} className="eyebrow mt-4 text-amber">
            Got it
          </button>
        </div>
      )}

      {/* Editor toolbar */}
      <div className="fixed bottom-4 left-1/2 z-[75] flex w-[min(68rem,calc(100vw-1rem))] -translate-x-1/2 flex-wrap items-center gap-1.5 border border-grey-800 bg-ink px-3 py-2 font-sans text-paper shadow-2xl">
        <a href="/admin" className="px-2 py-1.5 text-sm text-grey-300 hover:text-amber" title="Back to dashboard">
          ← Dashboard
        </a>
        <label className="sr-only" htmlFor="page-switch">
          Page
        </label>
        <select
          id="page-switch"
          value={page.id}
          onChange={(e) => void goToPage(e.target.value)}
          className="max-w-44 border border-grey-700 bg-grey-900 px-2 py-1.5 text-sm text-paper"
        >
          {EDITABLE_PAGES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className={`px-3 py-1.5 text-sm ${panelOpen ? "bg-paper text-ink" : "text-grey-200 hover:text-amber"}`}
        >
          All settings
        </button>
        <button
          type="button"
          onClick={() => setShowEditable((v) => !v)}
          aria-pressed={showEditable}
          className={`px-3 py-1.5 text-sm ${showEditable ? "text-amber" : "text-grey-200 hover:text-amber"}`}
          title="Outline everything you can click to edit"
        >
          Outlines
        </button>
        <button
          type="button"
          onClick={() => {
            setPreview((v) => !v);
            setTarget(null);
            setHover(null);
          }}
          aria-pressed={preview}
          className={`px-3 py-1.5 text-sm ${preview ? "bg-paper text-ink" : "text-grey-200 hover:text-amber"}`}
        >
          {preview ? "Back to editing" : "Preview"}
        </button>

        <span className="ml-auto flex items-center gap-2 px-2 text-xs text-grey-300" aria-live="polite">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${
              saveState === "error" ? "bg-paper" : saveState === "saved" && unpublished.size === 0 ? "bg-grey-500" : "bg-amber"
            }`}
          />
          {statusText}
        </span>
        {unpublished.size > 0 && (
          <button type="button" onClick={() => setDialog("discard")} className="px-2 py-1.5 text-sm text-grey-300 hover:text-amber">
            Discard
          </button>
        )}
        <AdminButton
          variant="primary"
          size="sm"
          disabled={busy || (unpublished.size === 0 && saveState === "saved")}
          onClick={() => setDialog("publish")}
        >
          Publish
        </AdminButton>
      </div>

      <ConfirmDialog
        open={dialog === "publish"}
        title="Publish your changes?"
        confirmLabel="Publish now"
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={publish}
      >
        {changedTitles.length > 0
          ? `These pages will update on the live website straight away: ${changedTitles.join(", ")}.`
          : "Your latest edits will go live on the website straight away."}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "discard"}
        title="Discard all unpublished changes?"
        confirmLabel="Discard changes"
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={discard}
      >
        Every edit that hasn’t been published ({changedTitles.join(", ") || "this page"}) will be thrown away. This
        can’t be undone.
      </ConfirmDialog>
      <Toast message={toast?.message ?? null} tone={toast?.tone} />
    </div>
  );
}

/* ---------- popovers ---------- */

function place(rect: DOMRect, width: number, height: number) {
  const margin = 12;
  const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
  const below = rect.bottom + 10;
  const top = below + height < window.innerHeight - 80 ? below : Math.max(margin, rect.top - height - 10);
  return { left, top, width };
}

function TextPopover({
  rect,
  docs,
  refField,
  onChange,
  onClose,
}: {
  rect: DOMRect;
  docs: ContentMap;
  refField: FieldRef;
  onChange: (path: Path, value: unknown) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const root = docs[refField.doc];
  const value = String(getAt(root, refField.path) ?? "");
  const key = refField.path[refField.path.length - 1];
  const parentPath = refField.path.slice(0, -1);
  const parent = getAt(root, parentPath);
  const hasLink = isRecord(parent) && typeof parent.href === "string";
  const vendorNames = refField.doc === "home" ? ((getAt(root, ["problem", "vendors"]) as string[] | undefined) ?? []) : [];
  const highlights = isRecord(parent) && Array.isArray(parent.vendors) ? (parent.vendors as number[]) : null;
  const list = nearestList(root, refField.path);
  const listItems = list ? (getAt(root, list.listPath) as unknown[]) : null;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const pos = place(rect, 420, 240 + (hasLink ? 60 : 0) + (highlights ? 110 : 0));

  function listAction(kind: "add" | "remove" | "up" | "down") {
    if (!list || !listItems) return;
    const items = [...listItems];
    const i = list.index;
    if (kind === "add") items.splice(i + 1, 0, itemTemplate(items) ?? blankOf(items[i]));
    if (kind === "remove") items.splice(i, 1);
    if (kind === "up" && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
    if (kind === "down" && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
    onChange(list.listPath, items);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-label={`Edit ${describePath(refField.path)}`}
      className="fixed z-[70] border border-grey-200 bg-paper p-4 font-sans text-ink shadow-2xl"
      style={pos}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-grey-500">
          {refField.doc === "site" && <span className="mr-1 bg-grey-100 px-1.5 py-0.5 text-grey-700">Site-wide</span>}
          {describePath(refField.path)}
        </p>
        <button type="button" onClick={onClose} className="text-xs text-grey-500 hover:text-ink" aria-label="Close">
          Done
        </button>
      </div>
      <textarea
        ref={inputRef}
        value={value}
        rows={isLongText(key, value) ? Math.min(8, Math.max(3, Math.ceil(value.length / 45))) : 2}
        onChange={(e) => onChange(refField.path, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !isLongText(key, value)) {
            e.preventDefault();
            onClose();
          }
        }}
        className="mt-2 block w-full resize-y border border-grey-300 px-3 py-2 text-base leading-relaxed focus:border-ink focus:outline-none"
      />
      {hasLink && (
        <label className="mt-3 block text-xs font-medium text-grey-700">
          {humanise("href")}
          <input
            type="text"
            list="site-paths"
            value={String((parent as { href: string }).href)}
            onChange={(e) => onChange([...parentPath, "href"], e.target.value)}
            className="mt-1 block w-full border border-grey-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
          />
          <datalist id="site-paths">
            {EDITABLE_PAGES.filter((p) => p.path).map((p) => (
              <option key={p.id} value={p.path!}>
                {p.title}
              </option>
            ))}
          </datalist>
        </label>
      )}
      {highlights && vendorNames.length > 0 && (
        <fieldset className="mt-3">
          <legend className="text-xs font-medium text-grey-700">Vendors this pain point lights up</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {vendorNames.map((name, i) => {
              const on = highlights.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    onChange(
                      [...parentPath, "vendors"],
                      on ? highlights.filter((v) => v !== i) : [...highlights, i].sort((a, b) => a - b),
                    )
                  }
                  className={`border px-2 py-1 text-xs ${on ? "border-ink bg-ink text-paper" : "border-grey-300"}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {list && listItems && (
        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-grey-100 pt-3 text-xs">
          <span className="mr-1 text-grey-500">
            {humanise(String(list.listPath[list.listPath.length - 1]))} item {list.index + 1} of {listItems.length}:
          </span>
          <button type="button" onClick={() => listAction("add")} className="border border-grey-300 px-2 py-1 hover:border-ink">
            + Add after
          </button>
          <button type="button" onClick={() => listAction("up")} disabled={list.index === 0} className="border border-grey-300 px-2 py-1 hover:border-ink disabled:opacity-40">
            ↑
          </button>
          <button
            type="button"
            onClick={() => listAction("down")}
            disabled={list.index === listItems.length - 1}
            className="border border-grey-300 px-2 py-1 hover:border-ink disabled:opacity-40"
          >
            ↓
          </button>
          <button type="button" onClick={() => listAction("remove")} className="border border-grey-300 px-2 py-1 hover:border-ink hover:bg-ink hover:text-paper">
            Remove
          </button>
        </div>
      )}
      <p className="mt-3 text-[11px] text-grey-500">Changes show on the page as you type and save automatically.</p>
    </div>
  );
}

function ImagePopover({
  rect,
  value,
  onAlt,
  onUpload,
  onLibrary,
  onClose,
}: {
  rect: DOMRect;
  value: { src: string; alt: string };
  onAlt: (alt: string) => void;
  onUpload: (file: File) => Promise<void>;
  onLibrary: () => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const pos = place(rect, 380, 300);

  return (
    <div
      role="dialog"
      aria-label="Edit image"
      className="fixed z-[70] border border-grey-200 bg-paper p-4 font-sans text-ink shadow-2xl"
      style={pos}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs text-grey-500">Image</p>
        <button type="button" onClick={onClose} className="text-xs text-grey-500 hover:text-ink">
          Done
        </button>
      </div>
      <div className="mt-2 flex gap-3">
        <img src={value.src} alt="" className="size-20 shrink-0 border border-grey-200 object-cover" />
        <div className="flex flex-col gap-2">
          <AdminButton variant="dark" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "Uploading…" : "Upload new image"}
          </AdminButton>
          <AdminButton size="sm" onClick={onLibrary}>
            Choose from library
          </AdminButton>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            await onUpload(file);
            setUploading(false);
          }}
        />
      </div>
      <label className="mt-4 block text-xs font-medium text-grey-700">
        Describe the image
        <span className="block font-normal text-grey-500">Read aloud to blind visitors and used by Google.</span>
        <input
          type="text"
          value={value.alt}
          onChange={(e) => onAlt(e.target.value)}
          className="mt-1 block w-full border border-grey-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
      </label>
    </div>
  );
}
