/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Bookmark, 
  BookmarkCheck, 
  Trash2, 
  Copy, 
  Check, 
  FileDown, 
  Search, 
  Calendar,
  Layers,
  FileCheck2
} from "lucide-react";
import { GeneratedReport } from "../types";
import { downloadReportAsPdf } from "../utils";

interface HistoryFavoritesProps {
  reports: GeneratedReport[];
  onToggleFavorite: (id: string, current: boolean) => Promise<void>;
  onDeleteReport: (id: string) => Promise<void>;
  onlyFavorites?: boolean;
  darkMode: boolean;
}

export default function HistoryFavorites({ reports, onToggleFavorite, onDeleteReport, onlyFavorites = false, darkMode }: HistoryFavoritesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch = 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.originalInput.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.formattedOutput.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (onlyFavorites) {
      return r.favorite && matchesSearch;
    }
    return matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handlePdf = (r: GeneratedReport) => {
    downloadReportAsPdf(r.title, r.originalInput, r.formattedOutput);
  };

  return (
    <div className="space-y-6">
      {/* Header block */}
      <div className="border-b pb-4 dark:border-slate-800">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {onlyFavorites ? "Saved Favorite Reports" : "Operations Report History"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Review, reuse, copy, or export previously generated reports securely stored in your personal workspace database.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search within logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`block w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-700"}`}
          />
        </div>
      </div>

      {/* List reports rendering */}
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg dark:border-slate-850 border-slate-200 text-slate-500">
          <Bookmark className="w-10 h-10 text-slate-400 mb-2 animate-pulse" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">No saved files matching queries</span>
          <span className="text-[11px] text-slate-500 mt-1">Generated entries from AI Writer or Operations Forms are automatically logged.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((r) => (
            <div 
              key={r.id}
              className={`p-5 rounded-xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded border border-blue-500/20">
                    {r.type.toUpperCase() || "CAT"}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{r.title}</h4>
                </div>
                
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  <span>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 block">Original Text / Context</span>
                  <div className={`p-3 rounded-lg border text-xs italic whitespace-pre-wrap line-clamp-4 ${darkMode ? "bg-slate-950 border-slate-900 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                    {r.originalInput || "[Form fields log representation]"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 block">Generated English Report</span>
                  <div className={`p-3 rounded-lg border text-xs font-sans whitespace-pre-wrap line-clamp-4 select-all ${darkMode ? "bg-[#111d38]/50 border-slate-900 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-800"}`}>
                    {r.formattedOutput}
                  </div>
                </div>
              </div>

              {/* Interactive buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(r.id, r.formattedOutput)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                  >
                    {copiedId === r.id ? (
                      <>
                        <Check className="w-3 h-3" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Output
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handlePdf(r)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border rounded-lg transition ${darkMode ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    <FileDown className="w-3 h-3 text-blue-500" /> PDF
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleFavorite(r.id, r.favorite)}
                    className={`p-2 rounded-lg transition ${r.favorite ? "text-amber-500 bg-amber-500/10" : "text-slate-400 hover:text-slate-200"}`}
                    title={r.favorite ? "Remove from Favorites" : "Bookmark to Favorites"}
                  >
                    {r.favorite ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteReport(r.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                    title="Delete Log permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
