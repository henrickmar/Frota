export type VehicleStatus = "Ativo" | "Manutenção" | "Inativo";

export interface Vehicle {
  id: string;
  nome: string;
  categoria: "Caminhão" | "Escavadeira" | "Munck" | "Caçamba";
  anoModelo: string;
  status: VehicleStatus;
  unidade: "km" | "h";
  medidorAtual?: number | undefined;
  revisaoKm?: number | undefined;
  revisaoData?: string | undefined;
}

export interface Fueling {
  id: string;
  data: string; // ISO
  veiculoId: string;
  inicial: number;
  final: number;
  litros: number;
  valor: number;
  combustivel?: Combustivel | undefined;
}

export type Combustivel = "Diesel" | "Gasolina" | "Arla";
export const COMBUSTIVEIS: Combustivel[] = ["Diesel", "Gasolina", "Arla"];
export const combOf = (f: Fueling): Combustivel => f.combustivel ?? "Diesel"

export interface Maintenance {
  id: string;
  data: string;
  veiculoId: string;
  tipo: "Preventiva" | "Corretiva" | "Revisão / Troca de óleo";
  categoria: "Mecânica" | "Elétrica" | "Pneus" | "Hidráulica" | "Funilaria";
  medidor: number;
  oficina: string;
  pecas: number;
  maoDeObra: number;
  obs?: string | undefined;
}

export const vehicles: Vehicle[] = [
  { id: "v1", nome: "Munck-04", categoria: "Munck", anoModelo: "2021 · VW 17.230", status: "Ativo", unidade: "km" },
  { id: "v2", nome: "Escavadeira-07", categoria: "Escavadeira", anoModelo: "2019 · CAT 320D", status: "Manutenção", unidade: "h" },
  { id: "v3", nome: "Caçamba-12", categoria: "Caçamba", anoModelo: "2022 · MB Atego", status: "Ativo", unidade: "km" },
  { id: "v4", nome: "Caminhão-02", categoria: "Caminhão", anoModelo: "2018 · Ford F-4000", status: "Inativo", unidade: "km" },
  { id: "v5", nome: "Escavadeira-03", categoria: "Escavadeira", anoModelo: "2020 · Komatsu PC200", status: "Ativo", unidade: "h" },
  { id: "v6", nome: "Caminhão-09", categoria: "Caminhão", anoModelo: "2023 · Volvo FMX", status: "Ativo", unidade: "km" },
];

// Deterministic mock generation
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seeded(42);
const start = new Date("2026-04-01T00:00:00");

export const fuelings: Fueling[] = (() => {
  const out: Fueling[] = [];
  const meters: Record<string, number> = { v1: 84200, v2: 5120, v3: 61300, v4: 142000, v5: 3890, v6: 22400 };
  for (let d = 0; d < 180; d += 3) {
    for (const v of vehicles) {
      if (v.status === "Inativo" && d > 60) continue;
      if (rand() < 0.45) continue;
      const date = new Date(start);
      date.setDate(date.getDate() + Math.floor(d / 1));
      if (date > new Date("2026-09-28")) continue;
      const litros = Math.round(80 + rand() * 220);
      const perL = v.unidade === "km" ? 2.6 + rand() * 1.6 : 0.12 + rand() * 0.1;
      const inicial = meters[v.id]!;
      const final = Math.round((inicial + litros * perL) * 10) / 10;
      meters[v.id] = final;
      out.push({
        id: `f${out.length + 1}`,
        data: date.toISOString().slice(0, 10),
        veiculoId: v.id,
        inicial,
        final,
        litros,
        valor: Math.round(litros * (5.9 + rand() * 0.5) * 100) / 100,
      });
    }
  }
  return out.reverse();
})();

const oficinas = ["Diesel Master", "Oficina Central", "Pneus Rota Sul", "Hidrotec", "Autoelétrica Faísca"];
const cats: Maintenance["categoria"][] = ["Mecânica", "Elétrica", "Pneus", "Hidráulica", "Funilaria"];

export const maintenances: Maintenance[] = (() => {
  const out: Maintenance[] = [];
  for (let i = 0; i < 34; i++) {
    const v = vehicles[Math.floor(rand() * vehicles.length)]!;
    const date = new Date(start);
    date.setDate(date.getDate() + Math.floor(rand() * 178));
    const pecas = Math.round(300 + rand() * 6500);
    out.push({
      id: `m${i + 1}`,
      data: date.toISOString().slice(0, 10),
      veiculoId: v.id,
      tipo: rand() < 0.55 ? "Preventiva" : "Corretiva",
      categoria: cats[Math.floor(rand() * cats.length)]!,
      medidor: v.unidade === "km" ? Math.round(60000 + rand() * 80000) : Math.round(3000 + rand() * 3000),
      oficina: oficinas[Math.floor(rand() * oficinas.length)]!,
      pecas,
      maoDeObra: Math.round(150 + rand() * 2200),
    });
  }
  return out.sort((a, b) => b.data.localeCompare(a.data));
})();

export const vehicleById = (id: string) => vehicles.find((v) => v.id === id)!;

export const consumo = (f: Fueling) => (f.litros ? (f.final - f.inicial) / f.litros : 0);
export const consumoLabel = (f: Fueling, unidade: "km" | "h" = "km") =>
  `${consumo(f).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${unidade === "km" ? "km/l" : "h/l"}`;

export const brl = (n: number, compact = false) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: compact ? 0 : 2,
  });

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const inRange = (iso: string, from: string, to: string) =>
  (!from || iso >= from) && (!to || iso <= to);
