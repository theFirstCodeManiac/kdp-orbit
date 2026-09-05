import React, { useState, useRef, useCallback } from "react";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Save,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  LayoutTemplate,
  Settings,
  Layers,
  MousePointer2,
  Lock,
} from "lucide-react";
import { CoverElement, KdpConfig } from "./types.ts";
import { KdpCanvas } from "./KdpCanvas.tsx";
import { PropertiesPanel } from "./PropertiesPanel.tsx";
import { useSubscription } from "@/src/context/SubscriptionContext.tsx";
import { useAuth } from "@/src/context/AuthContext.tsx";
import { analytics } from "@/src/services/analytics/analytics.ts";

// Pre-defined templates
const TEMPLATES = [
  {
    name: "Blank Canvas",
    elements: [],
  },
  {
    name: "Simple Non-Fiction",
    elements: [
      {
        id: "bg",
        type: "rect",
        x: 0,
        y: 0,
        width: 3000,
        height: 2000,
        fill: "#1e293b",
        rotation: 0,
        assetSource: "platform",
      } as CoverElement,
      {
        id: "t1",
        type: "text",
        x: 1000,
        y: 300,
        width: 600,
        height: 100,
        text: "THE ALGORITHM",
        fontSize: 72,
        fill: "#ffffff",
        fontFamily: "Arial",
        textAlign: "center",
        rotation: 0,
        assetSource: "platform",
      } as CoverElement,
      {
        id: "t2",
        type: "text",
        x: 1000,
        y: 400,
        width: 600,
        height: 50,
        text: "Mastering the AI Generation",
        fontSize: 24,
        fill: "#94a3b8",
        fontFamily: "Georgia",
        textAlign: "center",
        rotation: 0,
        assetSource: "platform",
      } as CoverElement,
      {
        id: "t3",
        type: "text",
        x: 1000,
        y: 800,
        width: 600,
        height: 50,
        text: "JOHN DOE",
        fontSize: 32,
        fill: "#ffffff",
        fontFamily: "Arial",
        textAlign: "center",
        rotation: 0,
        assetSource: "platform",
      } as CoverElement,
    ],
  },
];

export const CoverDesignerView: React.FC = () => {
  const { canAccess, isLoading: isSubscriptionLoading } = useSubscription();
  const { user } = useAuth();
  // State
  const [config, setConfig] = useState<KdpConfig>({
    format: "paperback",
    trimWidth: 6,
    trimHeight: 9,
    pageCount: 120,
    bleed: 0.125,
    paperType: "white",
  });

  const [elements, setElements] = useState<CoverElement[]>(
    TEMPLATES[0].elements,
  );
  const [past, setPast] = useState<CoverElement[][]>([]);
  const [future, setFuture] = useState<CoverElement[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.5); // Default zoomed out to fit screen

  const [activeTab, setActiveTab] = useState<"setup" | "add" | "properties">(
    "setup",
  );
  const [showExportModal, setShowExportModal] = useState(false);

  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History management
  const updateElements = useCallback(
    (newElements: CoverElement[]) => {
      setPast((prev) => [...prev, elements]);
      setElements(newElements);
      setFuture([]);
    },
    [elements],
  );

  const undo = () => {
    if (past.length === 0) return;
    const newPast = [...past];
    const previous = newPast.pop()!;
    setFuture([elements, ...future]);
    setElements(previous);
    setPast(newPast);
    setSelectedId(null);
  };

  const redo = () => {
    if (future.length === 0) return;
    const newFuture = [...future];
    const next = newFuture.shift()!;
    setPast([...past, elements]);
    setElements(next);
    setFuture(newFuture);
    setSelectedId(null);
  };

  // Add Tools
  const addElement = (element: Omit<CoverElement, "id">) => {
    const newEl: CoverElement = {
      ...element,
      id: Math.random().toString(36).substr(2, 9),
    };
    const nextElements = [...elements, newEl];
    updateElements(nextElements);
    analytics.track(
      "cover_created",
      {
        element_count: nextElements.length,
        source: "cover_designer",
      },
      user?.id,
    );
    setSelectedId(newEl.id);
    setActiveTab("properties");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        addElement({
          type: "image",
          src: reader.result as string,
          x: 100,
          y: 100,
          width: 300,
          height: 300,
          rotation: 0,
          assetSource: "user",
        });
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Properties Tools
  const updateSelectedElement = (updated: CoverElement) => {
    const newElements = elements.map((el) =>
      el.id === updated.id ? updated : el,
    );
    updateElements(newElements);
  };

  const deleteSelectedElement = () => {
    if (!selectedId) return;
    const newElements = elements.filter((el) => el.id !== selectedId);
    updateElements(newElements);
    setSelectedId(null);
  };

  const duplicateSelectedElement = () => {
    if (!selectedId) return;
    const el = elements.find((e) => e.id === selectedId);
    if (el) {
      addElement({
        ...el,
        x: el.x + 20,
        y: el.y + 20,
      });
    }
  };

  const changeLayer = (dir: "up" | "down") => {
    if (!selectedId) return;
    const idx = elements.findIndex((e) => e.id === selectedId);
    if (idx < 0) return;

    if (dir === "up" && idx < elements.length - 1) {
      const newEl = [...elements];
      [newEl[idx], newEl[idx + 1]] = [newEl[idx + 1], newEl[idx]];
      updateElements(newEl);
    } else if (dir === "down" && idx > 0) {
      const newEl = [...elements];
      [newEl[idx], newEl[idx - 1]] = [newEl[idx - 1], newEl[idx]];
      updateElements(newEl);
    }
  };

  // Export
  const handleExport = () => {
    if (!isSubscriptionLoading && !canAccess("canExportCover")) {
      alert(
        "Cover exporting requires a Premium subscription. Please upgrade your plan in the Billing & Plans tab.",
      );
      return;
    }
    setShowExportModal(true);
  };

  const executeExport = () => {
    setShowExportModal(false);
    if (!stageRef.current) return;
    setSelectedId(null); // Deselect to hide transform box
    analytics.track(
      "cover_exported",
      {
        format: "png",
        trim_width: config.trimWidth,
        trim_height: config.trimHeight,
        source: "cover_designer",
      },
      user?.id,
    );
    setTimeout(() => {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 1 }); // Or higher for print
      const link = document.createElement("a");
      link.download = `cover_export_${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 100);
  };

  const selectedElement = elements.find((e) => e.id === selectedId) || null;

  // Compute Asset usage for the modal
  const assetCounts = elements.reduce(
    (acc, el) => {
      const source = el.assetSource || "platform";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 shrink-0 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800 mr-4">Cover Designer</h2>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>

          <button
            onClick={undo}
            disabled={past.length === 0}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          <div className="h-6 w-px bg-slate-200 mx-2"></div>

          <button
            onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-slate-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 px-3 py-1.5 rounded hover:bg-slate-100 transition">
            <Save className="h-4 w-4" /> Save Project
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 px-4 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm"
          >
            {!isSubscriptionLoading && !canAccess("canExportCover") ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}{" "}
            Export Image
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("setup")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex justify-center border-b-2 transition ${activeTab === "setup" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <Settings className="h-4 w-4 mb-1 mx-auto" /> Setup
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex justify-center border-b-2 transition ${activeTab === "add" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <Layers className="h-4 w-4 mb-1 mx-auto" /> Elements
            </button>
            <button
              onClick={() => setActiveTab("properties")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex justify-center border-b-2 transition ${activeTab === "properties" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <MousePointer2 className="h-4 w-4 mb-1 mx-auto" /> Edit
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "setup" && (
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Book Format
                  </label>
                  <select
                    value={config.format}
                    onChange={(e) =>
                      setConfig({ ...config, format: e.target.value as any })
                    }
                    className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500"
                  >
                    <option value="paperback">Paperback</option>
                    <option value="hardcover">Hardcover</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Width (in)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.trimWidth}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          trimWidth: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Height (in)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.trimHeight}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          trimHeight: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Page Count
                    </label>
                    <input
                      type="number"
                      value={config.pageCount}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pageCount: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Bleed (in)
                    </label>
                    <input
                      type="number"
                      step="0.125"
                      value={config.bleed}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          bleed: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Page count affects spine width calculation.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Paper Type
                  </label>
                  <select
                    value={config.paperType}
                    onChange={(e) =>
                      setConfig({ ...config, paperType: e.target.value as any })
                    }
                    className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500"
                  >
                    <option value="white">White Paper</option>
                    <option value="cream">Cream Paper</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Starter Templates
                  </label>
                  <div className="space-y-2">
                    {TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Load template? This will replace your current design.",
                            )
                          ) {
                            updateElements(tpl.elements);
                          }
                        }}
                        className="w-full flex items-center justify-between p-2.5 border border-slate-200 rounded hover:border-indigo-500 hover:bg-indigo-50 transition text-left"
                      >
                        <span className="text-sm font-semibold text-slate-700">
                          {tpl.name}
                        </span>
                        <LayoutTemplate className="h-4 w-4 text-indigo-500" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "add" && (
              <div className="p-5 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      addElement({
                        type: "text",
                        text: "TITLE",
                        x: 200,
                        y: 100,
                        width: 400,
                        height: 60,
                        fontSize: 64,
                        fontFamily: "Arial",
                        fill: "#000000",
                        textAlign: "center",
                        rotation: 0,
                        assetSource: "platform",
                      })
                    }
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
                  >
                    <Type className="h-6 w-6 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">
                      Add Title
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      addElement({
                        type: "text",
                        text: "Subtitle goes here",
                        x: 200,
                        y: 180,
                        width: 400,
                        height: 40,
                        fontSize: 32,
                        fontFamily: "Georgia",
                        fill: "#475569",
                        textAlign: "center",
                        rotation: 0,
                        assetSource: "platform",
                      })
                    }
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
                  >
                    <Type className="h-6 w-6 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">
                      Add Subtitle
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      addElement({
                        type: "text",
                        text: "Author Name",
                        x: 200,
                        y: 500,
                        width: 400,
                        height: 40,
                        fontSize: 32,
                        fontFamily: "Arial",
                        fill: "#000000",
                        textAlign: "center",
                        rotation: 0,
                        assetSource: "platform",
                      })
                    }
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
                  >
                    <Type className="h-6 w-6 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">
                      Add Author
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      addElement({
                        type: "text",
                        text: "Heading",
                        x: 200,
                        y: 200,
                        width: 300,
                        height: 50,
                        fontSize: 48,
                        fontFamily: "Arial",
                        fill: "#000000",
                        textAlign: "center",
                        rotation: 0,
                        assetSource: "platform",
                      })
                    }
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
                  >
                    <Type className="h-6 w-6 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">
                      Add Text
                    </span>
                  </button>
                </div>

                <div className="h-px bg-slate-200 my-2"></div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      addElement({
                        type: "rect",
                        x: 200,
                        y: 200,
                        width: 200,
                        height: 200,
                        fill: "#cccccc",
                        rotation: 0,
                        assetSource: "platform",
                      })
                    }
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
                  >
                    <Square className="h-6 w-6 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">
                      Rectangle
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      addElement({
                        type: "circle",
                        x: 200,
                        y: 200,
                        width: 200,
                        height: 200,
                        fill: "#cccccc",
                        rotation: 0,
                        assetSource: "platform",
                      })
                    }
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
                  >
                    <Circle className="h-6 w-6 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">
                      Circle
                    </span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
                  >
                    <ImageIcon className="h-6 w-6 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">
                      Upload Image
                    </span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {activeTab === "properties" && (
              <PropertiesPanel
                selectedElement={selectedElement}
                onChange={updateSelectedElement}
                onDelete={deleteSelectedElement}
                onDuplicate={duplicateSelectedElement}
                onLayerChange={changeLayer}
              />
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-slate-100 overflow-hidden relative">
          <KdpCanvas
            config={config}
            elements={elements}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              if (id) setActiveTab("properties");
            }}
            onChange={updateElements}
            stageRef={stageRef}
            zoom={zoom}
          />
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Export Cover Design
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Before exporting, please review the commercial rights and
              licensing terms for the assets used in your design.
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-slate-800 mb-2">
                  Assets in this design:
                </h4>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {assetCounts["platform"] > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                      <strong>
                        {assetCounts["platform"]} Platform Asset(s):
                      </strong>{" "}
                      Fully licensed for commercial KDP use without attribution.
                    </li>
                  )}
                  {assetCounts["user"] > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                      <strong>
                        {assetCounts["user"]} User Uploaded Asset(s):
                      </strong>{" "}
                      You are solely responsible for ensuring you have
                      commercial rights or that these are in the public domain.
                    </li>
                  )}
                  {assetCounts["licensed"] > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <strong>
                        {assetCounts["licensed"]} Licensed Asset(s):
                      </strong>{" "}
                      Covered under the platform's extended commercial license.
                    </li>
                  )}
                  {assetCounts["ai"] > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                      <strong>
                        {assetCounts["ai"]} AI Generated Asset(s):
                      </strong>{" "}
                      Cleared for commercial use under our platform generative
                      AI terms, though copyright ownership cannot be claimed.
                    </li>
                  )}
                  {Object.keys(assetCounts).length === 0 && (
                    <li className="text-slate-500 italic">
                      No assets detected.
                    </li>
                  )}
                </ul>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                By clicking "Accept & Export", you confirm that you have read
                and agree to the licensing terms and hold full rights to
                commercially distribute any user-uploaded content.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={executeExport}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
              >
                Accept & Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
