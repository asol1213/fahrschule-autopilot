"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase Realtime Hook — abonniert Tabellenänderungen und ruft onUpdate auf.
 *
 * Voraussetzung: Realtime-Replication muss in der Supabase-Konsole für
 * die entsprechenden Tabellen aktiviert sein.
 *
 * @param tables - Tabellen, auf die gelauscht wird
 * @param tenantId - Tenant-ID für Filter (nur eigene Daten)
 * @param onUpdate - Callback bei Datenänderung (debounced 2s)
 * @returns isConnected - ob die Realtime-Verbindung steht
 */
export function useRealtimeSubscription(
  tables: string[],
  tenantId: string | null,
  onUpdate: () => void,
): boolean {
  const [isConnected, setIsConnected] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  useEffect(() => {
    if (!tenantId || tables.length === 0) return;

    const supabase = createClient();
    const channel = supabase.channel(`analytics-${tenantId}`);

    for (const table of tables) {
      channel.on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table,
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          // Debounce: bei schnellen Änderungen nicht jedes Mal neu laden
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            onUpdateRef.current();
          }, 2000);
        },
      );
    }

    channel.subscribe((status) => {
      setIsConnected(status === "SUBSCRIBED");
    });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [tenantId, tables.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return isConnected;
}
