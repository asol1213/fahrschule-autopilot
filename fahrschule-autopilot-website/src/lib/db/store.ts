/**
 * Supabase Data Store
 *
 * CRUD-Operationen für alle CRM-Entitäten via Supabase.
 * Alle getBySchueler()-Methoden erfordern tenantId für Tenant-Isolation.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  Schueler,
  Fahrstunde,
  Zahlung,
  Dokument,
  Kommunikation,
  Pruefung,
  Fahrlehrer,
  Fahrzeug,
} from "./schema";

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

// Helper: snake_case DB row → camelCase TS object
function rowToSchueler(row: Record<string, unknown>): Schueler {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    vorname: row.vorname as string,
    nachname: row.nachname as string,
    email: row.email as string,
    telefon: row.telefon as string,
    geburtsdatum: row.geburtsdatum as string,
    adresse: (row.adresse as string) || "",
    plz: (row.plz as string) || "",
    ort: (row.ort as string) || "",
    fuehrerscheinklasse: row.fuehrerscheinklasse as string,
    vorbesitz: row.vorbesitz as string | undefined,
    status: row.status as Schueler["status"],
    fahrlehrerId: row.fahrlehrer_id as string | undefined,
    anmeldungsDatum: row.anmeldungs_datum as string,
    notizen: row.notizen as string | undefined,
    whatsappEinwilligung: row.whatsapp_einwilligung as boolean | undefined,
    emailEinwilligung: row.email_einwilligung as boolean | undefined,
    dsgvoEinwilligung: row.dsgvo_einwilligung as boolean | undefined,
    dsgvoEinwilligungDatum: row.dsgvo_einwilligung_datum as string | undefined,
    ausbildungBeendetAm: row.ausbildung_beendet_am as string | undefined,
    loeschungGeplantAm: row.loeschung_geplant_am as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToFahrstunde(row: Record<string, unknown>): Fahrstunde {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    schuelerId: row.schueler_id as string,
    fahrlehrerId: row.fahrlehrer_id as string | undefined,
    datum: row.datum as string,
    uhrzeit: row.uhrzeit as string,
    dauer: row.dauer as number,
    typ: row.typ as Fahrstunde["typ"],
    bewertung: row.bewertung as number | undefined,
    notizen: row.notizen as string | undefined,
    status: row.status as Fahrstunde["status"],
    createdAt: row.created_at as string,
  };
}

function rowToZahlung(row: Record<string, unknown>): Zahlung {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    schuelerId: row.schueler_id as string,
    betrag: Number(row.betrag),
    beschreibung: row.beschreibung as string,
    status: row.status as Zahlung["status"],
    faelligAm: row.faellig_am as string,
    bezahltAm: row.bezahlt_am as string | undefined,
    mahnungsStufe: (row.mahnungs_stufe as number) || 0,
    createdAt: row.created_at as string,
  };
}

function rowToDokument(row: Record<string, unknown>): Dokument {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    schuelerId: row.schueler_id as string,
    typ: row.typ as Dokument["typ"],
    dateiname: row.dateiname as string | undefined,
    uploadDatum: row.upload_datum as string | undefined,
    ablaufDatum: row.ablauf_datum as string | undefined,
    vorhanden: row.vorhanden as boolean,
    createdAt: row.created_at as string,
  };
}

function rowToKommunikation(row: Record<string, unknown>): Kommunikation {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    schuelerId: row.schueler_id as string,
    kanal: row.kanal as Kommunikation["kanal"],
    richtung: row.richtung as Kommunikation["richtung"],
    betreff: row.betreff as string | undefined,
    inhalt: row.inhalt as string,
    datum: row.datum as string,
  };
}

function rowToPruefung(row: Record<string, unknown>): Pruefung {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    schuelerId: row.schueler_id as string,
    typ: row.typ as Pruefung["typ"],
    datum: row.datum as string,
    ergebnis: row.ergebnis as Pruefung["ergebnis"] | undefined,
    fehlerpunkte: row.fehlerpunkte as number | undefined,
    notizen: row.notizen as string | undefined,
    createdAt: row.created_at as string,
  };
}

function rowToFahrlehrer(row: Record<string, unknown>): Fahrlehrer {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    vorname: row.vorname as string,
    nachname: row.nachname as string,
    telefon: row.telefon as string,
    email: row.email as string | undefined,
    fuehrerscheinklassen: row.fuehrerscheinklassen as string[],
    aktiv: row.aktiv as boolean,
  };
}

// ============================================================
// Schüler CRUD
// ============================================================
export const schuelerDb = {
  async create(data: Omit<Schueler, "id" | "createdAt" | "updatedAt">): Promise<Schueler | null> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("schueler")
      .insert({
        tenant_id: data.tenantId,
        vorname: data.vorname,
        nachname: data.nachname,
        email: data.email,
        telefon: data.telefon,
        geburtsdatum: data.geburtsdatum,
        adresse: data.adresse,
        plz: data.plz,
        ort: data.ort,
        fuehrerscheinklasse: data.fuehrerscheinklasse,
        vorbesitz: data.vorbesitz,
        status: data.status,
        fahrlehrer_id: data.fahrlehrerId,
        anmeldungs_datum: data.anmeldungsDatum,
        notizen: data.notizen,
        // DSGVO fields
        whatsapp_einwilligung: data.whatsappEinwilligung ?? false,
        email_einwilligung: data.emailEinwilligung ?? false,
        dsgvo_einwilligung: data.dsgvoEinwilligung ?? false,
        dsgvo_einwilligung_datum: data.dsgvoEinwilligungDatum ?? null,
        ausbildung_beendet_am: data.ausbildungBeendetAm ?? null,
        loeschung_geplant_am: data.loeschungGeplantAm ?? null,
      })
      .select()
      .single();
    if (error || !row) return null;
    return rowToSchueler(row);
  },

  async getById(id: string, tenantId?: string): Promise<Schueler | null> {
    const supabase = await createClient();
    let query = supabase.from("schueler").select().eq("id", id).is("deleted_at", null);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data: row } = await query.single();
    return row ? rowToSchueler(row) : null;
  },

  async getByTenant(tenantId: string, pagination?: PaginationOptions): Promise<Schueler[]> {
    const supabase = await createClient();
    let query = supabase
      .from("schueler")
      .select()
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (pagination?.limit) query = query.limit(pagination.limit);
    if (pagination?.offset) query = query.range(pagination.offset, pagination.offset + (pagination.limit ?? 50) - 1);
    const { data: rows } = await query;
    return (rows || []).map(rowToSchueler);
  },

  async update(id: string, data: Partial<Schueler>, tenantId?: string): Promise<Schueler | null> {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = {};
    if (data.vorname !== undefined) updateData.vorname = data.vorname;
    if (data.nachname !== undefined) updateData.nachname = data.nachname;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.telefon !== undefined) updateData.telefon = data.telefon;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.fahrlehrerId !== undefined) updateData.fahrlehrer_id = data.fahrlehrerId;
    if (data.notizen !== undefined) updateData.notizen = data.notizen;
    if (data.adresse !== undefined) updateData.adresse = data.adresse;
    if (data.plz !== undefined) updateData.plz = data.plz;
    if (data.ort !== undefined) updateData.ort = data.ort;
    if (data.whatsappEinwilligung !== undefined) updateData.whatsapp_einwilligung = data.whatsappEinwilligung;
    if (data.emailEinwilligung !== undefined) updateData.email_einwilligung = data.emailEinwilligung;
    if (data.dsgvoEinwilligung !== undefined) updateData.dsgvo_einwilligung = data.dsgvoEinwilligung;
    if (data.dsgvoEinwilligungDatum !== undefined) updateData.dsgvo_einwilligung_datum = data.dsgvoEinwilligungDatum;
    if (data.ausbildungBeendetAm !== undefined) updateData.ausbildung_beendet_am = data.ausbildungBeendetAm;
    if (data.loeschungGeplantAm !== undefined) updateData.loeschung_geplant_am = data.loeschungGeplantAm;

    let query = supabase.from("schueler").update(updateData).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data: row, error } = await query.select().single();
    if (error || !row) return null;
    return rowToSchueler(row);
  },

  async delete(id: string, tenantId?: string): Promise<boolean> {
    const supabase = await createClient();
    let query = supabase.from("schueler").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { error } = await query;
    return !error;
  },

  async hardDelete(id: string, tenantId?: string): Promise<boolean> {
    const supabase = await createClient();
    let query = supabase.from("schueler").delete().eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { error } = await query;
    return !error;
  },

  async search(tenantId: string, query: string): Promise<Schueler[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("schueler")
      .select()
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .or(`vorname.ilike.%${query}%,nachname.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(500);
    return (rows || []).map(rowToSchueler);
  },

  async getByStatus(tenantId: string, status: string): Promise<Schueler[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("schueler")
      .select()
      .eq("tenant_id", tenantId)
      .eq("status", status)
      .is("deleted_at", null)
      .limit(500);
    return (rows || []).map(rowToSchueler);
  },

  async count(tenantId: string): Promise<number> {
    const supabase = await createClient();
    const { count } = await supabase
      .from("schueler")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);
    return count || 0;
  },
};

// ============================================================
// Fahrstunden CRUD
// ============================================================
export const fahrstundenDb = {
  async create(data: Omit<Fahrstunde, "id" | "createdAt">): Promise<Fahrstunde | null> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("fahrstunden")
      .insert({
        tenant_id: data.tenantId,
        schueler_id: data.schuelerId,
        fahrlehrer_id: data.fahrlehrerId,
        datum: data.datum,
        uhrzeit: data.uhrzeit,
        dauer: data.dauer,
        typ: data.typ,
        status: data.status,
        notizen: data.notizen,
      })
      .select()
      .single();
    if (error || !row) return null;
    return rowToFahrstunde(row);
  },

  async getBySchueler(schuelerId: string, tenantId: string): Promise<Fahrstunde[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("fahrstunden")
      .select()
      .eq("schueler_id", schuelerId)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("datum", { ascending: false })
      .limit(500);
    return (rows || []).map(rowToFahrstunde);
  },

  async getByTenant(tenantId: string, pagination?: PaginationOptions): Promise<Fahrstunde[]> {
    const supabase = await createClient();
    let query = supabase
      .from("fahrstunden")
      .select()
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("datum", { ascending: false });
    if (pagination?.limit) query = query.limit(pagination.limit);
    if (pagination?.offset) query = query.range(pagination.offset, pagination.offset + (pagination.limit ?? 50) - 1);
    const { data: rows } = await query;
    return (rows || []).map(rowToFahrstunde);
  },

  async getByDate(tenantId: string, datum: string): Promise<Fahrstunde[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("fahrstunden")
      .select()
      .eq("tenant_id", tenantId)
      .eq("datum", datum)
      .is("deleted_at", null)
      .order("uhrzeit")
      .limit(500);
    return (rows || []).map(rowToFahrstunde);
  },

  async getByDateRange(tenantId: string, von: string, bis: string): Promise<Fahrstunde[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("fahrstunden")
      .select()
      .eq("tenant_id", tenantId)
      .gte("datum", von)
      .lte("datum", bis)
      .is("deleted_at", null)
      .order("datum")
      .order("uhrzeit")
      .limit(500);
    return (rows || []).map(rowToFahrstunde);
  },

  async update(id: string, data: Partial<Fahrstunde>, tenantId?: string): Promise<Fahrstunde | null> {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = {};
    if (data.datum !== undefined) updateData.datum = data.datum;
    if (data.uhrzeit !== undefined) updateData.uhrzeit = data.uhrzeit;
    if (data.dauer !== undefined) updateData.dauer = data.dauer;
    if (data.typ !== undefined) updateData.typ = data.typ;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.bewertung !== undefined) updateData.bewertung = data.bewertung;
    if (data.notizen !== undefined) updateData.notizen = data.notizen;
    if (data.fahrlehrerId !== undefined) updateData.fahrlehrer_id = data.fahrlehrerId;

    let query = supabase.from("fahrstunden").update(updateData).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data: row, error } = await query.select().single();
    if (error || !row) return null;
    return rowToFahrstunde(row);
  },

  async delete(id: string, tenantId?: string): Promise<boolean> {
    const supabase = await createClient();
    let query = supabase.from("fahrstunden").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { error } = await query;
    return !error;
  },
};

// ============================================================
// Zahlungen CRUD
// ============================================================
export const zahlungenDb = {
  async create(data: Omit<Zahlung, "id" | "createdAt">): Promise<Zahlung | null> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("zahlungen")
      .insert({
        tenant_id: data.tenantId,
        schueler_id: data.schuelerId,
        betrag: data.betrag,
        beschreibung: data.beschreibung,
        status: data.status,
        faellig_am: data.faelligAm,
        bezahlt_am: data.bezahltAm,
        mahnungs_stufe: data.mahnungsStufe,
      })
      .select()
      .single();
    if (error || !row) return null;
    return rowToZahlung(row);
  },

  async getBySchueler(schuelerId: string, tenantId: string): Promise<Zahlung[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("zahlungen")
      .select()
      .eq("schueler_id", schuelerId)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("faellig_am", { ascending: false })
      .limit(500);
    return (rows || []).map(rowToZahlung);
  },

  async getByTenant(tenantId: string, pagination?: PaginationOptions): Promise<Zahlung[]> {
    const supabase = await createClient();
    let query = supabase
      .from("zahlungen")
      .select()
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("faellig_am", { ascending: false });
    if (pagination?.limit) query = query.limit(pagination.limit);
    if (pagination?.offset) query = query.range(pagination.offset, pagination.offset + (pagination.limit ?? 50) - 1);
    const { data: rows } = await query;
    return (rows || []).map(rowToZahlung);
  },

  async getOffene(tenantId: string): Promise<Zahlung[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("zahlungen")
      .select()
      .eq("tenant_id", tenantId)
      .in("status", ["offen", "ueberfaellig"])
      .is("deleted_at", null)
      .order("faellig_am")
      .limit(500);
    return (rows || []).map(rowToZahlung);
  },

  async update(id: string, data: Partial<Zahlung>, tenantId?: string): Promise<Zahlung | null> {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.bezahltAm !== undefined) updateData.bezahlt_am = data.bezahltAm;
    if (data.mahnungsStufe !== undefined) updateData.mahnungs_stufe = data.mahnungsStufe;
    if (data.betrag !== undefined) updateData.betrag = data.betrag;
    if (data.beschreibung !== undefined) updateData.beschreibung = data.beschreibung;

    let query = supabase.from("zahlungen").update(updateData).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data: row, error } = await query.select().single();
    if (error || !row) return null;
    return rowToZahlung(row);
  },

  async delete(id: string, tenantId?: string): Promise<boolean> {
    const supabase = await createClient();
    let query = supabase.from("zahlungen").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { error } = await query;
    return !error;
  },

  async summe(tenantId: string, status?: string): Promise<number> {
    const supabase = await createClient();
    let query = supabase.from("zahlungen").select("betrag").eq("tenant_id", tenantId).is("deleted_at", null);
    if (status) query = query.eq("status", status);
    const { data: rows } = await query;
    return (rows || []).reduce((sum, r) => sum + Number(r.betrag), 0);
  },
};

// ============================================================
// Dokumente CRUD
// ============================================================
export const dokumenteDb = {
  async create(data: Omit<Dokument, "id" | "createdAt">): Promise<Dokument | null> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("dokumente")
      .insert({
        tenant_id: data.tenantId,
        schueler_id: data.schuelerId,
        typ: data.typ,
        dateiname: data.dateiname,
        upload_datum: data.uploadDatum,
        ablauf_datum: data.ablaufDatum,
        vorhanden: data.vorhanden,
      })
      .select()
      .single();
    if (error || !row) return null;
    return rowToDokument(row);
  },

  async getBySchueler(schuelerId: string, tenantId: string): Promise<Dokument[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("dokumente")
      .select()
      .eq("schueler_id", schuelerId)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .limit(500);
    return (rows || []).map(rowToDokument);
  },

  async delete(id: string, tenantId?: string): Promise<boolean> {
    const supabase = await createClient();
    let query = supabase.from("dokumente").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { error } = await query;
    return !error;
  },

  async getFehlende(tenantId: string): Promise<Dokument[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("dokumente")
      .select()
      .eq("tenant_id", tenantId)
      .eq("vorhanden", false)
      .is("deleted_at", null)
      .limit(500);
    return (rows || []).map(rowToDokument);
  },

  async update(id: string, data: Partial<Dokument>, tenantId?: string): Promise<Dokument | null> {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = {};
    if (data.vorhanden !== undefined) updateData.vorhanden = data.vorhanden;
    if (data.dateiname !== undefined) updateData.dateiname = data.dateiname;
    if (data.uploadDatum !== undefined) updateData.upload_datum = data.uploadDatum;
    if (data.ablaufDatum !== undefined) updateData.ablauf_datum = data.ablaufDatum;

    let query = supabase.from("dokumente").update(updateData).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data: row, error } = await query.select().single();
    if (error || !row) return null;
    return rowToDokument(row);
  },
};

// ============================================================
// Kommunikation CRUD
// ============================================================
export const kommunikationDb = {
  async create(data: Omit<Kommunikation, "id">): Promise<Kommunikation | null> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("kommunikation")
      .insert({
        tenant_id: data.tenantId,
        schueler_id: data.schuelerId,
        kanal: data.kanal,
        richtung: data.richtung,
        betreff: data.betreff,
        inhalt: data.inhalt,
        datum: data.datum,
      })
      .select()
      .single();
    if (error || !row) return null;
    return rowToKommunikation(row);
  },

  async getBySchueler(schuelerId: string, tenantId: string): Promise<Kommunikation[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("kommunikation")
      .select()
      .eq("schueler_id", schuelerId)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("datum", { ascending: false })
      .limit(500);
    return (rows || []).map(rowToKommunikation);
  },

  async getByTenant(tenantId: string, pagination?: PaginationOptions): Promise<Kommunikation[]> {
    const supabase = await createClient();
    let query = supabase
      .from("kommunikation")
      .select()
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("datum", { ascending: false });
    if (pagination?.limit) query = query.limit(pagination.limit);
    if (pagination?.offset) query = query.range(pagination.offset, pagination.offset + (pagination.limit ?? 50) - 1);
    const { data: rows } = await query;
    return (rows || []).map(rowToKommunikation);
  },

  async delete(id: string, tenantId?: string): Promise<boolean> {
    const supabase = await createClient();
    let query = supabase.from("kommunikation").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { error } = await query;
    return !error;
  },
};

// ============================================================
// Prüfungen CRUD
// ============================================================
export const pruefungenDb = {
  async create(data: Omit<Pruefung, "id" | "createdAt">): Promise<Pruefung | null> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("pruefungen")
      .insert({
        tenant_id: data.tenantId,
        schueler_id: data.schuelerId,
        typ: data.typ,
        datum: data.datum,
        ergebnis: data.ergebnis,
        fehlerpunkte: data.fehlerpunkte,
        notizen: data.notizen,
      })
      .select()
      .single();
    if (error || !row) return null;
    return rowToPruefung(row);
  },

  async getBySchueler(schuelerId: string, tenantId: string): Promise<Pruefung[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("pruefungen")
      .select()
      .eq("schueler_id", schuelerId)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("datum", { ascending: false })
      .limit(500);
    return (rows || []).map(rowToPruefung);
  },

  async getByTenant(tenantId: string, pagination?: PaginationOptions): Promise<Pruefung[]> {
    const supabase = await createClient();
    let query = supabase
      .from("pruefungen")
      .select()
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("datum", { ascending: false });
    if (pagination?.limit) query = query.limit(pagination.limit);
    if (pagination?.offset) query = query.range(pagination.offset, pagination.offset + (pagination.limit ?? 50) - 1);
    const { data: rows } = await query;
    return (rows || []).map(rowToPruefung);
  },

  async delete(id: string, tenantId?: string): Promise<boolean> {
    const supabase = await createClient();
    let query = supabase.from("pruefungen").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { error } = await query;
    return !error;
  },

  async bestehensquote(tenantId: string): Promise<number> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("pruefungen")
      .select("ergebnis")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .not("ergebnis", "is", null);
    if (!rows || rows.length === 0) return 0;
    const bestanden = rows.filter((r) => r.ergebnis === "bestanden").length;
    return Math.round((bestanden / rows.length) * 100);
  },
};

// ============================================================
// Fahrlehrer CRUD
// ============================================================
export const fahrlehrerDb = {
  async create(data: Omit<Fahrlehrer, "id">): Promise<Fahrlehrer | null> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("fahrlehrer")
      .insert({
        tenant_id: data.tenantId,
        vorname: data.vorname,
        nachname: data.nachname,
        telefon: data.telefon,
        email: data.email,
        fuehrerscheinklassen: data.fuehrerscheinklassen,
        aktiv: data.aktiv,
      })
      .select()
      .single();
    if (error || !row) return null;
    return rowToFahrlehrer(row);
  },

  async getByTenant(tenantId: string): Promise<Fahrlehrer[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("fahrlehrer")
      .select()
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("nachname")
      .limit(500);
    return (rows || []).map(rowToFahrlehrer);
  },

  async getById(id: string, tenantId?: string): Promise<Fahrlehrer | null> {
    const supabase = await createClient();
    let query = supabase.from("fahrlehrer").select().eq("id", id).is("deleted_at", null);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data: row } = await query.single();
    return row ? rowToFahrlehrer(row) : null;
  },

  async update(id: string, data: Partial<Fahrlehrer>, tenantId?: string): Promise<Fahrlehrer | null> {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = {};
    if (data.vorname !== undefined) updateData.vorname = data.vorname;
    if (data.nachname !== undefined) updateData.nachname = data.nachname;
    if (data.telefon !== undefined) updateData.telefon = data.telefon;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.aktiv !== undefined) updateData.aktiv = data.aktiv;
    if (data.fuehrerscheinklassen !== undefined) updateData.fuehrerscheinklassen = data.fuehrerscheinklassen;

    let query = supabase.from("fahrlehrer").update(updateData).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data: row, error } = await query.select().single();
    if (error || !row) return null;
    return rowToFahrlehrer(row);
  },

  async delete(id: string, tenantId?: string): Promise<boolean> {
    const supabase = await createClient();
    let query = supabase.from("fahrlehrer").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { error } = await query;
    return !error;
  },
};

// ============================================================
// Fahrzeuge CRUD
// ============================================================

function rowToFahrzeug(row: Record<string, unknown>): Fahrzeug {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    kennzeichen: row.kennzeichen as string,
    marke: row.marke as string,
    modell: row.modell as string,
    baujahr: row.baujahr as number,
    fuehrerscheinklasse: row.fuehrerscheinklasse as string,
    tuevBis: row.tuev_bis as string,
    kilometerstand: row.kilometerstand as number,
    status: row.status as Fahrzeug["status"],
    notizen: row.notizen as string | undefined,
    deletedAt: row.deleted_at as string | null | undefined,
    createdAt: row.created_at as string,
  };
}

export const fahrzeugeDb = {
  async create(data: Omit<Fahrzeug, "id" | "createdAt">): Promise<Fahrzeug | null> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("fahrzeuge")
      .insert({
        tenant_id: data.tenantId,
        kennzeichen: data.kennzeichen,
        marke: data.marke,
        modell: data.modell,
        baujahr: data.baujahr,
        fuehrerscheinklasse: data.fuehrerscheinklasse,
        tuev_bis: data.tuevBis,
        kilometerstand: data.kilometerstand,
        status: data.status,
        notizen: data.notizen,
      })
      .select()
      .single();
    if (error || !row) return null;
    return rowToFahrzeug(row);
  },

  async getByTenant(tenantId: string): Promise<Fahrzeug[]> {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("fahrzeuge")
      .select()
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("kennzeichen")
      .limit(500);
    return (rows || []).map(rowToFahrzeug);
  },

  async getById(id: string, tenantId?: string): Promise<Fahrzeug | null> {
    const supabase = await createClient();
    let query = supabase.from("fahrzeuge").select().eq("id", id).is("deleted_at", null);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data: row } = await query.single();
    return row ? rowToFahrzeug(row) : null;
  },

  async update(id: string, data: Partial<Fahrzeug>, tenantId?: string): Promise<Fahrzeug | null> {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = {};
    if (data.kennzeichen !== undefined) updateData.kennzeichen = data.kennzeichen;
    if (data.marke !== undefined) updateData.marke = data.marke;
    if (data.modell !== undefined) updateData.modell = data.modell;
    if (data.baujahr !== undefined) updateData.baujahr = data.baujahr;
    if (data.fuehrerscheinklasse !== undefined) updateData.fuehrerscheinklasse = data.fuehrerscheinklasse;
    if (data.tuevBis !== undefined) updateData.tuev_bis = data.tuevBis;
    if (data.kilometerstand !== undefined) updateData.kilometerstand = data.kilometerstand;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notizen !== undefined) updateData.notizen = data.notizen;

    let query = supabase.from("fahrzeuge").update(updateData).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data: row, error } = await query.select().single();
    if (error || !row) return null;
    return rowToFahrzeug(row);
  },

  async delete(id: string, tenantId?: string): Promise<boolean> {
    const supabase = await createClient();
    let query = supabase.from("fahrzeuge").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { error } = await query;
    return !error;
  },
};
