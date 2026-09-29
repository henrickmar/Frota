import type { ReactNode } from "react";
import type { VehicleStatus } from "@/lib/fleet-data";
import { useFleet } from "@/lib/fleet-store";
import { cn } from "@/lib/utils";

export function Panel({ title, right, children, className }: { title?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("glass-panel overflow-hidden", className)}>
      {title && (
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display font-semibold">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, tone = "muted" }: { label: string; value: string; hint: string; tone?: "success" | "warning" | "destructive" | "primary" | "muted" }) {
  const toneCls = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    primary: "text-primary",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="glass-panel p-5">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-display text-2xl font-bold sm:text-3xl">{value}</p>
      <p className={cn("mt-1 text-xs", toneCls)}>{hint}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: VehicleStatus }) {
  const cls = {
    Ativo: "bg-success/15 text-success",
    Manutenção: "bg-warning/15 text-warning",
    Inativo: "bg-muted text-muted-foreground",
  }[status];
  return <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs", cls)}>{status}</span>;
}

export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "primary" | "warning" | "muted" }) {
  const cls = { primary: "bg-primary/15 text-primary", warning: "bg-warning/15 text-warning", muted: "bg-muted text-muted-foreground" }[tone];
  return <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs", cls)}>{children}</span>;
}

export interface Filters {
  veiculo: string;
  de: string;
  ate: string;
}
export const emptyFilters: Filters = { veiculo: "", de: "", ate: "" };

export function FilterBar({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const { vehicles } = useFleet();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className="field" value={value.veiculo} onChange={(e) => onChange({ ...value, veiculo: e.target.value })} aria-label="Veículo">
        <option value="">Todos os veículos</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>{v.nome}</option>
        ))}
      </select>
      <input type="date" className="field" value={value.de} onChange={(e) => onChange({ ...value, de: e.target.value })} aria-label="Data inicial" />
      <span className="text-xs text-muted-foreground">até</span>
      <input type="date" className="field" value={value.ate} onChange={(e) => onChange({ ...value, ate: e.target.value })} aria-label="Data final" />
      {(value.veiculo || value.de || value.ate) && (
        <button className="text-xs text-primary hover:underline" onClick={() => onChange(emptyFilters)}>Limpar</button>
      )}
    </div>
  );
}

export function DataTable({ head, children, minWidth = 720 }: { head: { label: string; right?: boolean }[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border">
            {head.map((h) => (
              <th key={h.label} className={cn("whitespace-nowrap px-5 py-3 font-medium", h.right ? "text-right" : "text-left")}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border [&_td]:px-5 [&_td]:py-3 [&_tr]:transition-colors [&_tr:hover]:bg-accent">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="!py-10 text-center text-muted-foreground">Nenhum registro encontrado para os filtros.</td>
    </tr>
  );
}
