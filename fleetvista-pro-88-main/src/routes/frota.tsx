import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/fleet/AppShell";
import { DataTable, EmptyRow, Panel, StatusBadge } from "@/components/fleet/ui";
import type { Vehicle } from "@/lib/fleet-data";
import { useFleet } from "@/lib/fleet-store";
import { AddButton, RowActions, VehicleForm } from "@/components/fleet/forms";

export const Route = createFileRoute("/frota")({
  head: () => ({
    meta: [
      { title: "Frota — FrotaViva" },
      { name: "description", content: "Cadastro de veículos: caminhões, escavadeiras, muncks e caçambas por centro de custo." },
      { property: "og:title", content: "Frota — FrotaViva" },
      { property: "og:description", content: "Lista de veículos da frota com status e centro de custo." },
    ],
  }),
  component: FrotaPage,
});

function FrotaPage() {
  const { vehicles, deleteVehicle, currentMeter } = useFleet();
  const [editing, setEditing] = useState<Vehicle | undefined>();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const cats = [...new Set(vehicles.map((v) => v.categoria))];

  const rows = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (!q || v.nome.toLowerCase().includes(q.toLowerCase())) &&
          (!cat || v.categoria === cat) &&
          (!status || v.status === status),
      ),
    [q, cat, status, vehicles],
  );

  return (
    <AppShell eyebrow="Cadastro" title="Frota" actions={<AddButton onClick={() => { setEditing(undefined); setOpen(true); }}>Novo veículo</AddButton>}>
      <VehicleForm open={open} onOpenChange={setOpen} initial={editing} />
      <Panel
        title={`${rows.length} veículos`}
        right={
          <div className="flex flex-wrap gap-2">
            <input className="field" placeholder="Buscar veículo ou obra" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="field" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria">
              <option value="">Todas categorias</option>
              {cats.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="field" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
              <option value="">Todos status</option>
              <option>Ativo</option>
              <option>Manutenção</option>
              <option>Inativo</option>
            </select>
          </div>
        }
      >
        <DataTable head={[{ label: "Veículo" }, { label: "Categoria" }, { label: "Ano / Modelo" }, { label: "Km/Hor. atual", right: true }, { label: "Status" }, { label: "", right: true }]}>
          {rows.length === 0 && <EmptyRow cols={6} />}
          {rows.map((v) => (
            <tr key={v.id}>
              <td className="font-medium">{v.nome}</td>
              <td className="text-muted-foreground">{v.categoria}</td>
              <td className="text-muted-foreground">{v.anoModelo}</td>
              <td className="text-right font-medium text-primary">{currentMeter(v.id).toLocaleString("pt-BR")} {v.unidade}</td>
              <td><StatusBadge status={v.status} /></td>
              <td><RowActions onEdit={() => { setEditing(v); setOpen(true); }} onDelete={() => deleteVehicle(v.id)} confirmText={`Excluir ${v.nome} e todos os seus registros?`} /></td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AppShell>
  );
}
