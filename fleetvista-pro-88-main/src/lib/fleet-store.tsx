import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Fueling, Maintenance, Vehicle } from "./fleet-data";
import { supabase } from "./supabase";

interface FleetData {
  vehicles: Vehicle[];
  fuelings: Fueling[];
  maintenances: Maintenance[];
}

interface FleetCtx extends FleetData {
  loading: boolean;
  vehicleById: (id: string) => Vehicle | undefined;
  currentMeter: (id: string) => number;
  saveVehicle: (v: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  saveFueling: (f: Fueling) => void;
  deleteFueling: (id: string) => void;
  saveMaintenance: (m: Maintenance) => void;
  deleteMaintenance: (id: string) => void;
}

// Keep a single context instance across hot reloads so the provider and hooks always match.
const g = globalThis as unknown as { __fleetCtx?: React.Context<FleetCtx | null> };
const Ctx = (g.__fleetCtx ??= createContext<FleetCtx | null>(null));

const empty: FleetData = { vehicles: [], fuelings: [], maintenances: [] };

/* ---------- mapeamento app (camelCase) <-> banco (snake_case) ---------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
const vehicleFromRow = (r: any): Vehicle => ({
  id: r.id,
  nome: r.nome,
  categoria: r.categoria,
  anoModelo: r.ano_modelo ?? "",
  status: r.status,
  unidade: r.unidade,
  medidorAtual: r.medidor_atual ?? undefined,
  revisaoKm: r.revisao_km ?? undefined,
  revisaoData: r.revisao_data ?? undefined,
});
const vehicleToRow = (v: Vehicle) => ({
  id: v.id,
  nome: v.nome,
  categoria: v.categoria,
  ano_modelo: v.anoModelo,
  status: v.status,
  unidade: v.unidade,
  medidor_atual: v.medidorAtual ?? null,
  revisao_km: v.revisaoKm ?? null,
  revisao_data: v.revisaoData ?? null,
});

const fuelingFromRow = (r: any): Fueling => ({
  id: r.id,
  data: r.data,
  veiculoId: r.veiculo_id,
  inicial: Number(r.inicial),
  final: Number(r.final),
  litros: Number(r.litros),
  valor: Number(r.valor),
  combustivel: r.combustivel ?? undefined,
});
const fuelingToRow = (f: Fueling) => ({
  id: f.id,
  data: f.data,
  veiculo_id: f.veiculoId,
  inicial: f.inicial,
  final: f.final,
  litros: f.litros,
  valor: f.valor,
  combustivel: f.combustivel ?? "Diesel",
});

const maintFromRow = (r: any): Maintenance => ({
  id: r.id,
  data: r.data,
  veiculoId: r.veiculo_id,
  tipo: r.tipo,
  categoria: r.categoria,
  medidor: Number(r.medidor),
  oficina: r.oficina ?? "",
  pecas: Number(r.pecas),
  maoDeObra: Number(r.mao_de_obra),
  obs: r.obs ?? undefined,
});
const maintToRow = (m: Maintenance) => ({
  id: m.id,
  data: m.data,
  veiculo_id: m.veiculoId,
  tipo: m.tipo,
  categoria: m.categoria,
  medidor: m.medidor,
  oficina: m.oficina,
  pecas: m.pecas,
  mao_de_obra: m.maoDeObra,
  obs: m.obs ?? null,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ---------- regras de negócio (puras) ---------- */

function upsert<T extends { id: string }>(list: T[], item: T) {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];
}
const byDateDesc = <T extends { data: string }>(l: T[]) => [...l].sort((a, b) => b.data.localeCompare(a.data));
const bump = (vs: Vehicle[], id: string, n: number) =>
  vs.map((v) => (v.id === id && n > (v.medidorAtual ?? 0) ? { ...v, medidorAtual: n } : v));

function applyFueling(d: FleetData, f: Fueling): FleetData {
  return { ...d, vehicles: bump(d.vehicles, f.veiculoId, f.final), fuelings: byDateDesc(upsert(d.fuelings, f)) };
}

function applyMaintenance(d: FleetData, m: Maintenance): FleetData {
  let vehicles = bump(d.vehicles, m.veiculoId, m.medidor);
  if (m.tipo === "Revisão / Troca de óleo") {
    const next = new Date(m.data + "T12:00:00");
    next.setMonth(next.getMonth() + 6);
    const nextData = next.toISOString().slice(0, 10);
    vehicles = vehicles.map((v) =>
      v.id === m.veiculoId ? { ...v, revisaoKm: m.medidor + 5000, revisaoData: nextData } : v,
    );
  }
  return { ...d, vehicles, maintenances: byDateDesc(upsert(d.maintenances, m)) };
}

export const newId = () => crypto.randomUUID();

export function FleetProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FleetData>(empty);
  const [loading, setLoading] = useState(true);
  const ref = useRef(data);
  ref.current = data;

  const load = useCallback(async () => {
    const [v, f, m] = await Promise.all([
      supabase.from("vehicles").select("*").order("nome"),
      supabase.from("fuelings").select("*").order("data", { ascending: false }),
      supabase.from("maintenances").select("*").order("data", { ascending: false }),
    ]);
    const err = v.error ?? f.error ?? m.error;
    if (err) {
      toast.error("Não foi possível carregar os dados: " + err.message);
    } else {
      setData({
        vehicles: (v.data ?? []).map(vehicleFromRow),
        fuelings: (f.data ?? []).map(fuelingFromRow),
        maintenances: (m.data ?? []).map(maintFromRow),
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Executa a gravação; se falhar, avisa e recarrega o estado real do banco.
  const persist = useCallback(
    async (...ops: PromiseLike<{ error: { message: string } | null }>[]) => {
      const results = await Promise.all(ops);
      const err = results.find((r) => r.error)?.error;
      if (err) {
        toast.error("Erro ao salvar: " + err.message);
        void load();
      }
    },
    [load],
  );

  const vehicleById = useCallback((id: string) => data.vehicles.find((v) => v.id === id), [data.vehicles]);

  const currentMeter = useCallback(
    (id: string) =>
      Math.max(
        data.vehicles.find((v) => v.id === id)?.medidorAtual ?? 0,
        ...data.fuelings.filter((f) => f.veiculoId === id).map((f) => f.final),
        ...data.maintenances.filter((m) => m.veiculoId === id).map((m) => m.medidor),
      ),
    [data],
  );

  const value = useMemo<FleetCtx>(
    () => ({
      ...data,
      loading,
      vehicleById,
      currentMeter,
      saveVehicle: (v) => {
        setData((d) => ({ ...d, vehicles: upsert(d.vehicles, v) }));
        void persist(supabase.from("vehicles").upsert(vehicleToRow(v)));
      },
      // fuelings e maintenances do veículo saem junto via ON DELETE CASCADE no banco
      deleteVehicle: (id) => {
        setData((d) => ({
          vehicles: d.vehicles.filter((v) => v.id !== id),
          fuelings: d.fuelings.filter((f) => f.veiculoId !== id),
          maintenances: d.maintenances.filter((m) => m.veiculoId !== id),
        }));
        void persist(supabase.from("vehicles").delete().eq("id", id));
      },
      saveFueling: (f) => {
        const next = applyFueling(ref.current, f);
        setData(next);
        const veh = next.vehicles.find((v) => v.id === f.veiculoId);
        void persist(
          ...(veh ? [supabase.from("vehicles").upsert(vehicleToRow(veh))] : []),
          supabase.from("fuelings").upsert(fuelingToRow(f)),
        );
      },
      deleteFueling: (id) => {
        setData((d) => ({ ...d, fuelings: d.fuelings.filter((f) => f.id !== id) }));
        void persist(supabase.from("fuelings").delete().eq("id", id));
      },
      saveMaintenance: (m) => {
        const next = applyMaintenance(ref.current, m);
        setData(next);
        const veh = next.vehicles.find((v) => v.id === m.veiculoId);
        void persist(
          ...(veh ? [supabase.from("vehicles").upsert(vehicleToRow(veh))] : []),
          supabase.from("maintenances").upsert(maintToRow(m)),
        );
      },
      deleteMaintenance: (id) => {
        setData((d) => ({ ...d, maintenances: d.maintenances.filter((m) => m.id !== id) }));
        void persist(supabase.from("maintenances").delete().eq("id", id));
      },
    }),
    [data, loading, vehicleById, currentMeter, persist],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFleet() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFleet must be used inside FleetProvider");
  return c;
}
