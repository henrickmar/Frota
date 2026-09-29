import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/fleet/AppShell";
import { DataTable, emptyFilters, FilterBar, Kpi, Panel, StatusBadge, type Filters } from "@/components/fleet/ui";
import { AlertTriangle } from "lucide-react";
import { brl, COMBUSTIVEIS, combOf, fmtDate, inRange } from "@/lib/fleet-data";
import { useFleet } from "@/lib/fleet-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FrotaViva Gestão de Frota" },
      { name: "description", content: "Resumo de custos de combustível, manutenções e consolidado por veículo da sua frota." },
      { property: "og:title", content: "Dashboard — FrotaViva Gestão de Frota" },
      { property: "og:description", content: "KPIs e gráficos de custos operacionais da frota pesada." },
    ],
  }),
  component: Dashboard,
});

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function Dashboard() {
  const [f, setF] = useState<Filters>(emptyFilters);
  const { vehicles, fuelings, maintenances, currentMeter } = useFleet();

  const data = useMemo(() => {
    const fu = fuelings.filter((x) => (!f.veiculo || x.veiculoId === f.veiculo) && inRange(x.data, f.de, f.ate));
    const ma = maintenances.filter((x) => (!f.veiculo || x.veiculoId === f.veiculo) && inRange(x.data, f.de, f.ate));
    const fuelTotal = fu.reduce((s, x) => s + x.valor, 0);
    const maintTotal = ma.reduce((s, x) => s + x.pecas + x.maoDeObra, 0);
    const litros = fu.reduce((s, x) => s + x.litros, 0);

    const perVehicle = vehicles
      .filter((v) => !f.veiculo || v.id === f.veiculo)
      .map((v) => {
        const comb = fu.filter((x) => x.veiculoId === v.id).reduce((s, x) => s + x.valor, 0);
        const man = ma.filter((x) => x.veiculoId === v.id).reduce((s, x) => s + x.pecas + x.maoDeObra, 0);
        return { ...v, comb, man, total: comb + man };
      })
      .sort((a, b) => b.total - a.total);

    const byMonth = new Map<string, { litros: number; valor: number }>();
    [...fu].reverse().forEach((x) => {
      const k = x.data.slice(0, 7);
      const cur = byMonth.get(k) ?? { litros: 0, valor: 0 };
      cur.litros += x.litros;
      cur.valor += x.valor;
      byMonth.set(k, cur);
    });
    const timeline = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ mes: `${k.slice(5)}/${k.slice(2, 4)}`, ...v }));

    const porComb = COMBUSTIVEIS.map((c) => { const r = fu.filter((x) => combOf(x) === c); return { c, valor: r.reduce((s, x) => s + x.valor, 0), litros: r.reduce((s, x) => s + x.litros, 0) }; });
    return { porComb, fuelTotal, maintTotal, litros, perVehicle, timeline, nMaint: ma.length, nCorr: ma.filter((m) => m.tipo === "Corretiva").length };
  }, [f, vehicles, fuelings, maintenances]);

  const ativos = vehicles.filter((v) => v.status === "Ativo").length;
  const manut = vehicles.filter((v) => v.status === "Manutenção").length;
  const inat = vehicles.filter((v) => v.status === "Inativo").length;
  const hoje = new Date().toISOString().slice(0, 10);
  const alertas = vehicles.flatMap((v) => {
    const out: { id: string; nome: string; msg: string; vencido: boolean }[] = [];
    const atual = currentMeter(v.id);
    if (v.revisaoKm != null) {
      const falta = v.revisaoKm - atual;
      const lim = v.unidade === "h" ? 50 : 1000;
      if (falta <= lim) out.push({ id: v.id + "k", nome: v.nome, vencido: falta <= 0, msg: falta <= 0 ? `Revisão/óleo vencida há ${(-falta).toLocaleString("pt-BR")} ${v.unidade}` : `Faltam ${falta.toLocaleString("pt-BR")} ${v.unidade} para revisão/óleo` });
    }
    if (v.revisaoData) {
      const dias = Math.round((new Date(v.revisaoData).getTime() - new Date(hoje).getTime()) / 86400000);
      if (dias <= 15) out.push({ id: v.id + "d", nome: v.nome, vencido: dias < 0, msg: dias < 0 ? `Revisão/óleo vencida desde ${fmtDate(v.revisaoData)}` : `Revisão/óleo em ${dias} dia${dias === 1 ? "" : "s"} (${fmtDate(v.revisaoData)})` });
    }
    return out;
  });
  const withCost = data.perVehicle.filter((v) => v.total > 0).length || 1;

  return (
    <AppShell eyebrow="Painel operacional" title="Resumo da frota" actions={<FilterBar value={f} onChange={setF} />}>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Combustível acumulado" value={brl(data.fuelTotal, true)} hint={`${data.litros.toLocaleString("pt-BR")} litros abastecidos`} tone="primary" />
        <Kpi label="Manutenções" value={brl(data.maintTotal, true)} hint={`${data.nMaint} ordens · ${data.nCorr} corretivas`} tone="destructive" />
        <Kpi label="Custo consolidado" value={brl(data.fuelTotal + data.maintTotal, true)} hint={`média ${brl((data.fuelTotal + data.maintTotal) / withCost, true)} por veículo`} />
        <Kpi label="Frota ativa" value={`${ativos} / ${vehicles.length}`} hint={`${manut} em manutenção · ${inat} inativo${inat === 1 ? "" : "s"}`} tone="warning" />
      </section>

      {alertas.length > 0 && (
        <Panel title={`Alertas de revisão / troca de óleo (${alertas.length})`}>
          <ul className="divide-y divide-border">
            {alertas.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <AlertTriangle className={`size-4 shrink-0 ${a.vencido ? "text-destructive" : "text-warning"}`} />
                <span className="font-medium">{a.nome}</span>
                <span className={a.vencido ? "text-destructive" : "text-muted-foreground"}>{a.msg}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {data.porComb.map((p) => (
          <Kpi key={p.c} label={p.c} value={brl(p.valor, true)} hint={`${p.litros.toLocaleString("pt-BR")} litros`} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Abastecimento ao longo do tempo" right={<span className="text-[11px] text-muted-foreground">litros · mês</span>} className="xl:col-span-2">
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="gFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => (n === "valor" ? brl(v) : `${v.toLocaleString("pt-BR")} L`)} />
                <Area type="monotone" dataKey="litros" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gFuel)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Manutenção por veículo">
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.perVehicle} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nome" width={100} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "var(--accent)" }} contentStyle={tooltipStyle} formatter={(v: number) => brl(v)} />
                <Bar dataKey="man" name="Manutenção" fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <Panel title="Consolidado por veículo">
        <DataTable
          head={[
            { label: "Veículo" },
            { label: "Categoria" },
            { label: "Status" },
            { label: "Combustível", right: true },
            { label: "Manutenção", right: true },
            { label: "Total", right: true },
          ]}
        >
          {data.perVehicle.map((v) => (
            <tr key={v.id}>
              <td className="font-medium">{v.nome}</td>
              <td className="text-muted-foreground">{v.categoria}</td>
              <td><StatusBadge status={v.status} /></td>
              <td className="text-right">{brl(v.comb)}</td>
              <td className="text-right">{brl(v.man)}</td>
              <td className="text-right font-semibold">{brl(v.total)}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AppShell>
  );
}
