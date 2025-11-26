"use client";
import { Tldraw, TLStore } from "tldraw";
import "tldraw/tldraw.css";
import { useCanvasStore } from "@/stores/canvasStore";
import { Button } from "../ui/button";
import { Download, Save, Trash2 } from "lucide-react";
import { useState, useCallback } from "react";

export function WhiteboardCanvas() {
  const { activeWhiteboard } = useCanvasStore();
  const [store, setStore] = useState<TLStore | null>(null);

  const handleMount = useCallback(
    (editor: any) => {
      setStore(editor.store);

      if (activeWhiteboard?.snapshot) {
        editor.store.loadSnapshot(activeWhiteboard.snapshot);
      }
    },
    [activeWhiteboard]
  );

  const handleSave = useCallback(async () => {
    if (!store) return;

    const snapshot = store.getStoreSnapshot();
    console.log("Whiteboard saved:", snapshot);
    // TODO: Save to Convex
  }, [store, activeWhiteboard]);

  const handleExport = useCallback(async () => {
    if (!store) return;

    const snapshot = store.getStoreSnapshot();
    const blob = new Blob([JSON.stringify(snapshot)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeWhiteboard?.title || "whiteboard"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [store, activeWhiteboard]);

  const handleClear = useCallback(() => {
    if (!store) return;
    const ids = Array.from(store.allRecords()).map((r) => r.id);
    store.remove(ids);
  }, [store]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {activeWhiteboard?.title || "Whiteboard"}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <Tldraw onMount={handleMount} persistenceKey={activeWhiteboard?.id} />
      </div>
    </div>
  );
}
