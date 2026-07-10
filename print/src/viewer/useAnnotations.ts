import { useCallback, useEffect, useRef, useState } from "react";
import type { Annotation, AnnotationsStore } from "../annotations.js";
import type { SelectionAnchor } from "./types.js";
import type { UseViewerControllerResult } from "./useViewerController.js";

/**
 * A rectangle (viewport coordinates) used to position the floating capture
 * control near the live selection. Kept as a plain shape (not a DOMRect) so the
 * hook stays testable without a real selection — jsdom's `getRangeAt` throws
 * when `rangeCount === 0`, so rect acquisition is guarded and falls back to a
 * zero rect while control VISIBILITY is gated on the (mockable) anchor.
 */
export interface CaptureRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * The current capturable selection: the anchor the renderer derived plus the
 * screen rect for positioning the floating control. Non-null exactly when the
 * user has a usable text selection inside a rendered text layer.
 */
export interface PendingCapture {
  anchor: SelectionAnchor;
  rect: CaptureRect;
}

export interface UseAnnotationsResult {
  /** The full annotation list, kept in sync with the store and the renderer. */
  annotations: Annotation[];
  /** The live capturable selection, or null when there is none. */
  pending: PendingCapture | null;
  /** Whether the inline note input is open (freezes selection tracking). */
  noteDraftOpen: boolean;
  /** Add a bare highlight (empty note) from the pending selection. */
  addHighlight: () => void;
  /** Open the inline note input for the pending selection. */
  openNoteDraft: () => void;
  /** Save a note annotation from the pending selection with the given text. */
  saveNote: (note: string) => void;
  /** Dismiss the capture control without saving. */
  cancelCapture: () => void;
  /** Remove an annotation by id. */
  removeAnnotation: (id: string) => void;
  /** Navigate to an annotation's position, then sync nav state. */
  goToAnnotation: (position: string) => void;
}

/** Mint a stable unique id for a new annotation. */
function mintId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // Fallback for environments without crypto.randomUUID: still unique enough
  // for a local annotation id (never a security token).
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Read the current selection's bounding rect for positioning the control.
 * Guarded: jsdom throws from `getRangeAt(0)` when there is no range, so a
 * missing/empty selection yields a zero rect rather than crashing. The control's
 * visibility does not depend on this — it is gated on the renderer's anchor.
 */
function currentSelectionRect(): CaptureRect {
  const sel =
    typeof window.getSelection === "function" ? window.getSelection() : null;
  if (sel && sel.rangeCount > 0) {
    const r = sel.getRangeAt(0).getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }
  return { top: 0, left: 0, width: 0, height: 0 };
}

/**
 * Owns the annotation list and the text-selection capture flow for the viewer,
 * mirroring {@link useBookmarks}: it loads from the injected store, exposes
 * add/remove/navigate, and pushes the list into the renderer via
 * `setAnnotations` so persistent highlights paint. Selection capture listens on
 * `selectionchange`, asks the renderer for a {@link SelectionAnchor}, and
 * surfaces it as `pending` for the floating control. Tracking freezes while the
 * note input is open so focusing it (which collapses the selection) does not
 * drop the pending capture.
 */
export function useAnnotations(
  controller: UseViewerControllerResult,
  store: AnnotationsStore,
): UseAnnotationsResult {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pending, setPending] = useState<PendingCapture | null>(null);
  const [noteDraftOpen, setNoteDraftOpen] = useState(false);
  const destroyed = useRef(false);

  // Read the current list / pending selection inside stable callbacks without
  // re-creating them (and without calling setState from a setState updater).
  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  // Register the selectionchange listener once; read the latest controller and
  // note-draft flag through refs so the listener never re-subscribes.
  const controllerRef = useRef(controller);
  controllerRef.current = controller;
  const noteDraftOpenRef = useRef(noteDraftOpen);
  noteDraftOpenRef.current = noteDraftOpen;

  // Load once on mount.
  useEffect(() => {
    store
      .load()
      .then((a) => {
        if (!destroyed.current) setAnnotations(a);
      })
      .catch((err) => {
        reportError(new Error("Failed to load annotations", { cause: err }));
      });
    return () => {
      destroyed.current = true;
    };
  }, []); // intentional: load once on mount; store identity is stable per mount

  // Push the list into the renderer whenever it changes or the renderer becomes
  // ready (navSignal bumps after init). setAnnotations is idempotent — it stores
  // the full list and re-applies highlights — so re-pushing is safe.
  useEffect(() => {
    controller.getRenderer()?.setAnnotations?.(annotations);
  }, [annotations, controller.navSignal]);

  // Track the live selection. Frozen while the note input is open so focusing
  // the input (which collapses the selection) does not clear the pending anchor.
  useEffect(() => {
    function handleSelectionChange() {
      if (noteDraftOpenRef.current) return;
      const renderer = controllerRef.current.getRenderer();
      const anchor = renderer?.getSelectionAnchor?.() ?? null;
      if (!anchor) {
        setPending(null);
        return;
      }
      setPending({ anchor, rect: currentSelectionRect() });
    }
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []); // register once; state read via refs

  function persist(next: Annotation[]) {
    setAnnotations(next);
    store.save(next).catch((err) => {
      reportError(new Error("Failed to save annotations", { cause: err }));
    });
  }

  function newAnnotation(anchor: SelectionAnchor, note: string): Annotation {
    return {
      id: mintId(),
      position: anchor.position,
      quote: anchor.quote,
      note,
      created: new Date().toISOString(),
      page: anchor.page,
      offset: anchor.offset,
      length: anchor.length,
    };
  }

  const addHighlight = useCallback(() => {
    const p = pendingRef.current;
    if (p) persist([...annotationsRef.current, newAnnotation(p.anchor, "")]);
    setPending(null);
    setNoteDraftOpen(false);
  }, []);

  const openNoteDraft = useCallback(() => {
    setNoteDraftOpen(true);
  }, []);

  const saveNote = useCallback((note: string) => {
    const p = pendingRef.current;
    if (p) persist([...annotationsRef.current, newAnnotation(p.anchor, note)]);
    setPending(null);
    setNoteDraftOpen(false);
  }, []);

  const cancelCapture = useCallback(() => {
    setPending(null);
    setNoteDraftOpen(false);
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    persist(annotationsRef.current.filter((a) => a.id !== id));
  }, []);

  const goToAnnotation = useCallback(
    (position: string) => {
      controllerRef.current
        .getRenderer()
        ?.goToPosition(position)
        .then(() => controllerRef.current.onPanelNavigate())
        .catch((err) => {
          reportError(new Error("Annotation navigation failed", { cause: err }));
        });
    },
    [],
  );

  return {
    annotations,
    pending,
    noteDraftOpen,
    addHighlight,
    openNoteDraft,
    saveNote,
    cancelCapture,
    removeAnnotation,
    goToAnnotation,
  };
}
