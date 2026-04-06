"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, PenTool, Trash2 } from "lucide-react";

export default function SchuelerVertragPage() {
  const [vertrag, setVertrag] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Nicht angemeldet.");
      setLoading(false);
      return;
    }

    // Find the student record linked to this user
    const { data: schueler } = await supabase
      .from("schueler")
      .select("id, tenant_id, vorname, nachname")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!schueler) {
      setError("Kein Schülerprofil gefunden.");
      setLoading(false);
      return;
    }

    // Find pending contracts for this student
    const { data: vertraege } = await supabase
      .from("vertraege")
      .select("*")
      .eq("schueler_id", schueler.id)
      .eq("tenant_id", schueler.tenant_id)
      .in("status", ["gesendet", "entwurf"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (vertraege && vertraege.length > 0) {
      setVertrag({ ...vertraege[0], schuelerName: `${schueler.vorname} ${schueler.nachname}`, tenantId: schueler.tenant_id });
    } else {
      // Check if already signed
      const { data: signedContracts } = await supabase
        .from("vertraege")
        .select("*")
        .eq("schueler_id", schueler.id)
        .eq("status", "unterschrieben")
        .order("created_at", { ascending: false })
        .limit(1);

      if (signedContracts && signedContracts.length > 0) {
        setVertrag(signedContracts[0] as Record<string, unknown>);
        setSigned(true);
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = () => {
      isDrawingRef.current = false;
    };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);

    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDraw);
      canvas.removeEventListener("mouseleave", stopDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDraw);
    };
  }, [vertrag, signed]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !vertrag) return;

    // Check if canvas has content
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((val, i) => i % 4 === 3 && val > 0);
    if (!hasContent) {
      setError("Bitte unterschreiben Sie zuerst im Feld unten.");
      return;
    }

    setSigning(true);
    setError("");

    try {
      const signatureUrl = canvas.toDataURL("image/png");

      const res = await fetch("/api/crm/vertrag", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: vertrag.id,
          tenantId: vertrag.tenantId || vertrag.tenant_id,
          unterschriftUrl: signatureUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Fehler beim Unterschreiben.");
      } else {
        setSigned(true);
      }
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-primary)]" />
      </div>
    );
  }

  if (!vertrag) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-background)] px-4">
        <div className="w-full max-w-lg text-center p-8 rounded-2xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <PenTool size={32} className="mx-auto mb-3 text-[var(--c-muted)]" />
          <h1 className="text-xl font-bold text-[var(--c-foreground)] mb-2">Kein Vertrag vorhanden</h1>
          <p className="text-[var(--c-muted)]">
            {error || "Es gibt derzeit keinen Vertrag zur Unterschrift."}
          </p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-background)] px-4">
        <div className="w-full max-w-lg text-center p-8 rounded-2xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
          <h1 className="text-2xl font-bold text-[var(--c-foreground)] mb-2">
            Vertrag erfolgreich unterschrieben!
          </h1>
          <p className="text-[var(--c-muted)]">
            Vielen Dank. Ihr unterschriebener Vertrag wurde gespeichert.
          </p>
        </div>
      </div>
    );
  }

  const isAusbildung = vertrag.vertragstyp === "ausbildungsvertrag";

  return (
    <div className="min-h-screen bg-[var(--c-background)] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="p-6 rounded-2xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <h1 className="text-xl font-bold text-[var(--c-foreground)] mb-1">
            {isAusbildung ? "Ausbildungsvertrag" : "Datenschutz-Einwilligungserklärung"}
          </h1>
          <p className="text-sm text-[var(--c-muted)] mb-6">
            Bitte lesen Sie den Vertrag sorgfältig durch und unterschreiben Sie unten.
          </p>

          {/* Contract text */}
          <div className="p-4 rounded-xl bg-[var(--c-surface-light)] border border-[var(--c-border)] text-sm text-[var(--c-foreground)] leading-relaxed space-y-3 mb-6 max-h-[400px] overflow-y-auto">
            {isAusbildung ? (
              <>
                <p className="font-semibold">Ausbildungsvertrag</p>
                <p>1. Gegenstand des Vertrages ist die theoretische und praktische Ausbildung zum Erwerb der Fahrerlaubnis.</p>
                <p>2. Die Fahrschule verpflichtet sich, den Fahrschüler nach den geltenden gesetzlichen Bestimmungen auszubilden.</p>
                <p>3. Der Fahrschüler verpflichtet sich zur regelmäßigen Teilnahme am Unterricht sowie zur pünktlichen Zahlung der vereinbarten Ausbildungsgebühren.</p>
                <p>4. Fahrstunden, die nicht mindestens 48 Stunden vorher abgesagt werden, werden in Rechnung gestellt.</p>
                <p>5. Der Vertrag kann von beiden Seiten mit einer Frist von 2 Wochen schriftlich gekündigt werden.</p>
                <p>6. Es gelten die Preise gemäß der aktuellen Preisliste der Fahrschule.</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Datenschutz-Einwilligungserklärung</p>
                <p>Hiermit willige ich in die Verarbeitung meiner personenbezogenen Daten zum Zwecke der Fahrausbildung ein.</p>
                <p>Die Daten werden ausschließlich für die Durchführung und Verwaltung der Fahrausbildung verwendet.</p>
                <p><strong>Erhobene Daten:</strong> Name, Adresse, Geburtsdatum, Kontaktdaten, Ausbildungsstand, Prüfungsergebnisse, Zahlungsinformationen.</p>
                <p>Die Einwilligung kann jederzeit widerrufen werden. Der Widerruf berührt nicht die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung.</p>
                <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO</p>
              </>
            )}
          </div>

          {/* Signature canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--c-foreground)]">Ihre Unterschrift</label>
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-[var(--c-muted)] hover:text-[var(--c-foreground)] transition-colors"
              >
                <Trash2 size={12} /> Löschen
              </button>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-40 rounded-xl border-2 border-dashed border-[var(--c-border)] bg-white cursor-crosshair touch-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            onClick={handleSign}
            disabled={signing}
            className="w-full mt-4 py-3 px-4 rounded-lg bg-[var(--c-primary)] text-white font-medium hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signing ? "Wird unterschrieben..." : "Unterschreiben"}
          </button>
        </div>
      </div>
    </div>
  );
}
