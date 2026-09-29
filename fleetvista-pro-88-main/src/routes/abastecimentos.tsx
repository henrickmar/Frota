import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/fleet/AppShell";
import { DataTable, EmptyRow, emptyFilters, FilterBar, Kpi, Panel, type Filters } from "@/components/fleet/ui";
import { brl, COMBUSTIVEIS, combOf, consumoLabel, fmtDate, inRange, type Fueling } from "@/lib/fleet-data";
import { useFleet } from "@/lib/fleet-store";
import { AddButton, FuelingForm, RowActions } from "@/components/fleet/forms";

export const Route = createFileRoute("/abastecimentos")({
  head: () => ({
    meta: [
      { title: "Abastecimentos — FrotaViva" },
      { name: "description", content: "Registro de abastecimentos com km/horímetro, litros, valor e consumo calculado." },
      { property: "og:title", content: "Abastecimentos — FrotaViva" },
      { property: "og:description", content: "Controle de combustível e consumo por veículo." },
    ],
  }),
  component: AbastecimentosPage,
});

function AbastecimentosPage() {
  const [f, setF] = useState<Filters>(emptyFilters);
  const [comb, setComb] = useState("");
  const { fuelings, vehicleById, deleteFueling } = useFleet();
  const [editing, setEditing] = useState<Fueling | undefined>();
  const [open, setOpen] = useState(false);
  const rows = useMemo(
    () => fuelings.filter((x) => (!f.veiculo || x.veiculoId === f.veiculo) && inRange(x.data, f.de, f.ate) && (!comb || combOf(x) === comb)),
    [f, comb, fuelings],
  );
  const litros = rows.reduce((s, x) => s + x.litros, 0);
  const valor = rows.reduce((s, x) => s + x.valor, 0);

  return (
    <AppShell eyebrow="Combustível" title="Abastecimentos" actions={<AddButton onClick={() => { setEditing(undefined); setOpen(true); }}>Novo abastecimento</AddButton>}>
      <FuelingForm open={open} onOpenChange={setOpen} initial={editing} />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Registros" value={rows.length.toString()} hint="no período filtrado" />
        <Kpi label="Litros" value={litros.toLocaleString("pt-BR")} hint="total abastecido" tone="primary" />
        <Kpi label="Valor total" value={brl(valor, true)} hint={`preço médio ${brl(litros ? valor / litros : 0)}/L`} />
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COMBUSTIVEIS.map((c) => {
          const r = rows.filter((x) => combOf(x) === c);
          return <Kpi key={c} label={c} value={brl(r.reduce((s, x) => s + x.valor, 0), true)} hint={`${r.reduce((s, x) => s + x.litros, 0).toLocaleString("pt-BR")} L`} />;
        })}
      </section>
      <Panel title="Histórico" right={
        <div className="flex flex-wrap items-center gap-2">
          <select className="field" value={comb} onChange={(e) => setComb(e.target.value)} aria-label="Combustível">
            <option value="">Todos combustíveis</option>
            {COMBUSTIVEIS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <FilterBar value={f} onChange={setF} />
        </div>
      }>
        <DataTable
          minWidth={980}
          head={[
            { label: "Data" },
            { label: "Veículo" },
            { label: "Combustível" },
            { label: "Km/Hor. inicial", right: true },
            { label: "Km/Hor. final", right: true },
            { label: "Litros", right: true },
            { label: "Valor total", right: true },
            { label: "Consumo", right: true },
            { label: "", right: true },
          ]}
        >
          {rows.length === 0 && <EmptyRow cols={9} />}
          {rows.map((x) => {
            const v = vehicleById(x.veiculoId);
            if (!v) return null;
            return (
              <tr key={x.id}>
                <td className="text-muted-foreground">{fmtDate(x.data)}</td>
                <td className="font-medium">{v.nome}</td>
                <td className="text-muted-foreground">{combOf(x)}</td>
                <td className="text-right">{x.inicial.toLocaleString("pt-BR")} {v.unidade}</td>
                <td className="text-right">{x.final.toLocaleString("pt-BR")} {v.unidade}</td>
                <td className="text-right">{x.litros.toLocaleString("pt-BR")}</td>
                <td className="text-right">{brl(x.valor)}</td>
                <td className="text-right font-medium text-primary">{combOf(x) === "Arla" ? "—" : consumoLabel(x, v.unidade)}</td>
                <td><RowActions onEdit={() => { setEditing(x); setOpen(true); }} onDelete={() => deleteFueling(x.id)} confirmText="Excluir este abastecimento?" /></td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
    </AppShell>
  );
}
