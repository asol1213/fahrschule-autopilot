"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/components/dashboard/TenantContext";
import { FileText, CheckCircle, AlertCircle, Upload, Loader2, X, Eye, Download } from "lucide-react";
import Link from "next/link";

const DOKUMENT_TYPEN = [
  { typ: "sehtest", label: "Sehtest" },
  { typ: "erste_hilfe", label: "Erste-Hilfe-Kurs" },
  { typ: "passfoto", label: "Passfoto" },
  { typ: "ausweis", label: "Personalausweis/Pass" },
  { typ: "fuehrerschein_antrag", label: "Führerscheinantrag" },
];

interface SchuelerDoks {
  id: string;
  vorname: string;
  nachname: string;
  status: string;
  dokumente: Array<{ id: string; typ: string; vorhanden: boolean; ablauf_datum: string | null; dateiname?: string; datei_url?: string }>;
}

export default function DokumentePage() {
  const [schuelerDoks, setSchuelerDoks] = useState<SchuelerDoks[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFehlend, setFilterFehlend] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // dokumentId being uploaded
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadRef = useRef<{ dokumentId: string; schuelerId: string; typ: string } | null>(null);
  const supabase = createClient();
  const tenantId = useTenantId();

  const load = useCallback(async () => {
    setLoading(true);

    const { data: schueler } = await supabase
      .from("schueler")
      .select("id, vorname, nachname, status, dokumente(id, typ, vorhanden, ablauf_datum, dateiname, datei_url)")
      .eq("tenant_id", tenantId)
      .not("status", "in", '("bestanden","abgebrochen")')
      .order("nachname");

    setSchuelerDoks((schueler || []) as unknown as SchuelerDoks[]);
    setLoading(false);
  }, [supabase, tenantId]);

  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);

  useEffect(() => { loadRef.current(); }, []);

  const triggerUpload = (dokumentId: string, schuelerId: string, typ: string) => {
    pendingUploadRef.current = { dokumentId, schuelerId, typ };
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const pending = pendingUploadRef.current;
    if (!file || !pending) return;

    // Reset input so the same file can be re-selected
    e.target.value = "";

    setUploading(pending.dokumentId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dokumentId", pending.dokumentId);

      const res = await fetch("/api/crm/dokumente/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        alert(err.error || "Upload fehlgeschlagen");
      } else {
        await load();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(null);
      pendingUploadRef.current = null;
    }
  };

  const getSignedUrl = async (dokumentId: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/crm/dokumente/download?dokumentId=${dokumentId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Fehler" }));
        alert(err.error || "Fehler beim Laden");
        return null;
      }
      const { url } = await res.json();
      return url;
    } catch {
      alert("Fehler beim Laden");
      return null;
    }
  };

  const viewDokument = async (dokumentId: string) => {
    const url = await getSignedUrl(dokumentId);
    if (url) window.open(url, "_blank");
  };

  const downloadDokument = async (dokumentId: string, dateiname: string) => {
    const url = await getSignedUrl(dokumentId);
    if (!url) return;
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = dateiname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  };

  const removeDokument = async (dokId: string) => {
    await supabase.from("dokumente").update({
      vorhanden: false,
      dateiname: null,
      datei_url: null,
      upload_datum: null,
    }).eq("id", dokId);
    load();
  };

  const createMissingDoks = async (schuelerId: string) => {
    const { data: existing } = await supabase.from("dokumente").select("typ").eq("schueler_id", schuelerId);
    const existingTypen = (existing || []).map((d) => d.typ);
    const missing = DOKUMENT_TYPEN.filter((d) => !existingTypen.includes(d.typ));

    if (missing.length > 0) {
      await supabase.from("dokumente").insert(
        missing.map((d) => ({
          tenant_id: tenantId,
          schueler_id: schuelerId,
          typ: d.typ,
          vorhanden: false,
        }))
      );
      load();
    }
  };

  const filtered = filterFehlend
    ? schuelerDoks.filter((s) => {
        const vorhandene = s.dokumente?.filter((d) => d.vorhanden).length || 0;
        return vorhandene < DOKUMENT_TYPEN.length;
      })
    : schuelerDoks;

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileSelected}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--c-foreground)]">Dokumente</h1>
        <button
          onClick={() => setFilterFehlend(!filterFehlend)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterFehlend ? "bg-[var(--c-primary)] text-white" : "bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-muted)]"
          }`}
        >
          {filterFehlend ? "Alle anzeigen" : "Nur fehlende"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-primary)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-[var(--c-muted)] rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p>Keine aktiven Schüler mit fehlenden Dokumenten.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const doks = s.dokumente || [];
            const complete = DOKUMENT_TYPEN.every((dt) => doks.some((d) => d.typ === dt.typ && d.vorhanden));

            return (
              <div key={s.id} className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <Link href={`/dashboard/schueler/${s.id}`} className="font-medium text-[var(--c-foreground)] hover:text-[var(--c-primary)]">
                    {s.vorname} {s.nachname}
                  </Link>
                  <div className="flex items-center gap-2">
                    {complete ? (
                      <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={14} /> Vollständig</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-orange-400"><AlertCircle size={14} /> Unvollständig</span>
                    )}
                    {doks.length < DOKUMENT_TYPEN.length && (
                      <button onClick={() => createMissingDoks(s.id)} className="text-xs text-[var(--c-primary)] hover:underline">
                        Checkliste erstellen
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {DOKUMENT_TYPEN.map((dt) => {
                    const dok = doks.find((d) => d.typ === dt.typ);
                    const isUploading = uploading === dok?.id;
                    return (
                      <div
                        key={dt.typ}
                        className={`relative p-2.5 rounded-lg text-xs font-medium text-center transition-colors border ${
                          dok?.vorhanden
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : dok
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-[var(--c-surface-light)] border-[var(--c-border)] text-[var(--c-muted)]"
                        }`}
                      >
                        {dok?.vorhanden ? (
                          <>
                            <CheckCircle size={14} className="mx-auto mb-1" />
                            <div>{dt.label}</div>
                            {dok.dateiname && (
                              <div className="mt-1 text-[10px] opacity-70 truncate" title={dok.dateiname}>
                                {dok.dateiname}
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-1 mt-1.5">
                              {dok.datei_url && (
                                <>
                                  <button
                                    onClick={() => viewDokument(dok.id)}
                                    className="p-1 rounded hover:bg-green-500/20"
                                    title="Ansehen"
                                  >
                                    <Eye size={12} />
                                  </button>
                                  <button
                                    onClick={() => downloadDokument(dok.id, dok.dateiname || "dokument")}
                                    className="p-1 rounded hover:bg-green-500/20"
                                    title="Herunterladen"
                                  >
                                    <Download size={12} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => dok && triggerUpload(dok.id, s.id, dt.typ)}
                                className="p-1 rounded hover:bg-green-500/20"
                                title="Ersetzen"
                              >
                                <Upload size={12} />
                              </button>
                              <button
                                onClick={() => dok && removeDokument(dok.id)}
                                className="p-1 rounded hover:bg-red-500/20 text-red-400"
                                title="Entfernen"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => dok && triggerUpload(dok.id, s.id, dt.typ)}
                            disabled={isUploading || !dok}
                            className="w-full"
                          >
                            {isUploading ? (
                              <Loader2 size={14} className="mx-auto mb-1 animate-spin" />
                            ) : (
                              <Upload size={14} className="mx-auto mb-1" />
                            )}
                            {dt.label}
                            {isUploading && (
                              <div className="mt-1 text-[10px]">Wird hochgeladen...</div>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
