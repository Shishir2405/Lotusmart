"use client";

import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { RiUploadCloud2Line, RiCheckLine, RiCloseLine, RiAlertLine } from "react-icons/ri";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import toast from "@/components/ui/toast";

interface RowResult {
  row: number;
  sku: string;
  name: string;
  action: "created" | "updated" | "skipped" | "errored";
  productId?: string;
  message?: string;
}

interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  errored: number;
  categoriesTouched: number;
  dryRun: boolean;
}

interface ImportResponse {
  data: {
    summary: ImportSummary;
    results: RowResult[];
  };
  message: string;
}

const ACTION_BADGE: Record<RowResult["action"], "success" | "info" | "warning" | "error"> = {
  created: "success",
  updated: "info",
  skipped: "warning",
  errored: "error",
};

export default function AdminBulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fssaiLicense, setFssaiLicense] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [results, setResults] = useState<RowResult[]>([]);

  const handleSubmit = async (dryRun: boolean) => {
    if (!file) {
      toast.error("Choose a CSV file first");
      return;
    }
    if (!fssaiLicense.trim()) {
      toast.error("Enter your FSSAI license number");
      return;
    }

    setSubmitting(true);
    setSummary(null);
    setResults([]);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("fssaiLicense", fssaiLicense.trim());
      fd.append("dryRun", String(dryRun));

      const res = await axios.post<ImportResponse>(
        "/api/admin/products/bulk-import",
        fd,
      );
      setSummary(res.data.data.summary);
      setResults(res.data.data.results);
      toast.success(res.data.message);
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Import failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Bulk Product Import</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Upload a CSV to create or update products. Categories are matched by slug; products are
          upserted by SKU. The FSSAI License you enter below is applied to every row.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            CSV File
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-neutral-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-neutral-900 file:text-white
                hover:file:bg-neutral-800
                file:cursor-pointer"
            />
          </div>
          {file && (
            <p className="text-xs text-neutral-500 mt-1.5">
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        <Input
          label="FSSAI License Number"
          value={fssaiLicense}
          onChange={(e) => setFssaiLicense(e.target.value)}
          placeholder="e.g. 10012345000000"
          hint="Applied to every product in the CSV"
        />

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
          >
            Validate Only (Dry Run)
          </Button>
          <Button
            leftIcon={<RiUploadCloud2Line />}
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting ? "Importing…" : "Run Import"}
          </Button>
        </div>
      </div>

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3"
        >
          <SummaryStat label="Total rows" value={summary.total} />
          <SummaryStat label="Created" value={summary.created} tone="success" />
          <SummaryStat label="Updated" value={summary.updated} tone="info" />
          <SummaryStat label="Errored" value={summary.errored} tone="error" />
          <SummaryStat label="Categories" value={summary.categoriesTouched} />
        </motion.div>
      )}

      {results.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Per-row results</h2>
            <p className="text-xs text-neutral-500">{results.length} rows</p>
          </div>
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5">Row</th>
                  <th className="text-left px-4 py-2.5">SKU</th>
                  <th className="text-left px-4 py-2.5">Product</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-left px-4 py-2.5">Detail</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={`${r.row}-${r.sku}`} className="border-t border-neutral-100">
                    <td className="px-4 py-2 text-neutral-600">{r.row}</td>
                    <td className="px-4 py-2 font-mono text-xs text-neutral-700">{r.sku}</td>
                    <td className="px-4 py-2 text-neutral-900">{r.name}</td>
                    <td className="px-4 py-2">
                      <Badge variant={ACTION_BADGE[r.action]}>
                        <span className="inline-flex items-center gap-1">
                          {r.action === "errored" ? (
                            <RiCloseLine />
                          ) : r.action === "skipped" ? (
                            <RiAlertLine />
                          ) : (
                            <RiCheckLine />
                          )}
                          {r.action}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-neutral-600">{r.message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "info" | "error";
}) {
  const toneCls =
    tone === "success"
      ? "text-emerald-600"
      : tone === "info"
        ? "text-blue-600"
        : tone === "error"
          ? "text-rose-600"
          : "text-neutral-900";
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4">
      <div className="text-xs text-neutral-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${toneCls}`}>{value}</div>
    </div>
  );
}
