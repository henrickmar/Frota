import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/fleet/AppShell";
import { DataTable, EmptyRow, emptyFilters, FilterBar, Kpi, Panel, Tag, type Filters } from "@/components/fleet/ui";
import { brl, fmtDate, inRange, type Maintenance } from "@/lib/fleet-data";
import { useFleet } from "@/lib/fleet-store";
import { AddButton, MaintenanceForm, RowActions } from "@/components/fleet/forms";

export const Route = createFileRoute("/manutencoes")({
  head: () => ({
    meta: [
      { title: "Manutenções — FrotaViva" },
      { name: "description", content: "Manutenções preventivas e corretivas com custos de peças, mão de obra e oficina." },
      { property: "og:title", content: "Manutenções — FrotaViva" },
      { property: "og:description", content: "Histórico e custos de manutenção da frota." },
    ],
  }),
  component: ManutencoesPage,
});

function ManutencoesPage() {
  const [f, setF] = useState<Filters>(emptyFilters);
  const [tipo, setTipo] = useState("");
  const { maintenances, vehicleById, deleteMaintenance } = useFleet();
  const [editing, setEditing] = useState<Maintenance | undefined>();
  const [open, setOpen] = useState(false);
  const rows = useMemo(
    () =>
      maintenances.filter(
        (x) => (!f.veiculo || x.veiculoId === f.veiculo) && inRange(x.data, f.de, f.ate) && (!tipo || x.tipo === tipo),
      ),
    [f, tipo, maintenances],
  );
  const pecas = rows.reduce((s, x) => s + x.pecas, 0);
  const mo = rows.reduce((s, x) => s + x.maoDeObra, 0);

  return (
    <AppShell eyebrow="Oficina" title="Manutenções" actions={<AddButton onClick={() => { setEditing(undefined); setOpen(true); }}>Nova manutenção</AddButton>}>
      <MaintenanceForm open={open} onOpenChange={setOpen} initial={editing} />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Peças" value={brl(pecas, true)} hint={`${rows.length} ordens de serviço`} />
        <Kpi label="Mão de obra" value={brl(mo, true)} hint="serviços de oficina" />
        <Kpi label="Custo total" value={brl(pecas + mo, true)} hint={`${rows.filter((r) => r.tipo === "Corretiva").length} corretivas`} tone="destructive" />
      </section>
      <Panel
        title="Histórico"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <select className="field" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo">
              <option value="">Todos os tipos</option>
              <option>Preventiva</option>
              <option>Corretiva</option>
            </select>
            <FilterBar value={f} onChange={setF} />
          </div>
        }
      >
        <DataTable
          minWidth={1200}
          head={[
            { label: "Data" },
            { label: "Veículo" },
            { label: "Tipo" },
            { label: "Categoria" },
            { label: "Km/Horímetro", right: true },
            { label: "Oficina" },
            { label: "Peças", right: true },
            { label: "Mão de obra", right: true },
            { label: "Total", right: true },
            { label: "Observação" },
            { label: "", right: true },
          ]}
        >
          {rows.length === 0 && <EmptyRow cols={11} />}
          {rows.map((x) => {
            const v = vehicleById(x.veiculoId);
            if (!v) return null;
            return (
              <tr key={x.id}>
                <td className="text-muted-foreground">{fmtDate(x.data)}</td>
                <td className="font-medium">{v.nome}</td>
                <td><Tag tone={x.tipo === "Preventiva" ? "primary" : "warning"}>{x.tipo}</Tag></td>
                <td className="text-muted-foreground">{x.categoria}</td>
                <td className="text-right">{x.medidor.toLocaleString("pt-BR")} {v.unidade}</td>
                <td className="text-muted-foreground">{x.oficina}</td>
                <td className="text-right">{brl(x.pecas)}</td>
                <td className="text-right">{brl(x.maoDeObra)}</td>
                <td className="text-right font-semibold">{brl(x.pecas + x.maoDeObra)}</td>
                <td className="max-w-[220px] truncate text-muted-foreground" title={x.obs}>{x.obs || "—"}</td>
                <td><RowActions onEdit={() => { setEditing(x); setOpen(true); }} onDelete={() => deleteMaintenance(x.id)} confirmText="Excluir esta manutenção?" /></td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
    </AppShell>
  );
}
