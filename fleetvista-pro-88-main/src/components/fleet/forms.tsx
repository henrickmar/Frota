import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COMBUSTIVEIS, type Combustivel, type Fueling, type Maintenance, type Vehicle } from "@/lib/fleet-data";
import { newId, useFleet } from "@/lib/fleet-store";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

function FormShell({ open, onOpenChange, title, onSubmit, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; onSubmit: () => void; children: ReactNode }) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {children}
          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancelar
            </button>
            <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Salvar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
      <Plus className="size-4" />
      {children}
    </button>
  );
}

export function RowActions({ onEdit, onDelete, confirmText }: { onEdit: () => void; onDelete: () => void; confirmText: string }) {
  return (
    <div className="flex justify-end gap-1">
      <button onClick={onEdit} aria-label="Editar" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-primary">
        <Pencil className="size-4" />
      </button>
      <button
        onClick={() => confirm(confirmText) && onDelete()}
        aria-label="Excluir"
        className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

const num = (s: string) => Number(String(s).replace(",", ".")) || 0;
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- Veículo ---------- */
export function VehicleForm({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Vehicle | undefined }) {
  const { saveVehicle } = useFleet();
  const blank: Vehicle = { id: "", nome: "", categoria: "Caminhão", anoModelo: "", status: "Ativo", unidade: "km" };
  const [v, setV] = useState<Vehicle>(initial ?? blank);
  useEffect(() => { if (open) setV(initial ?? blank); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FormShell open={open} onOpenChange={onOpenChange} title={initial ? "Editar veículo" : "Novo veículo"} onSubmit={() => saveVehicle({ ...v, id: v.id || newId() })}>
      <Field label="Nome / Identificação"><input required className="field" value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} /></Field>
      <Field label="Categoria">
        <select className="field" value={v.categoria} onChange={(e) => setV({ ...v, categoria: e.target.value as Vehicle["categoria"] })}>
          <option>Caminhão</option><option>Escavadeira</option><option>Munck</option><option>Caçamba</option>
        </select>
      </Field>
      <Field label="Ano / Modelo"><input required className="field" value={v.anoModelo} onChange={(e) => setV({ ...v, anoModelo: e.target.value })} /></Field>
      <Field label="Status">
        <select className="field" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as Vehicle["status"] })}>
          <option>Ativo</option><option>Manutenção</option><option>Inativo</option>
        </select>
      </Field>
      <Field label={`${v.unidade === "h" ? "Horímetro" : "Km"} atual`}><input inputMode="decimal" className="field" value={v.medidorAtual ?? ""} onChange={(e) => setV({ ...v, medidorAtual: e.target.value === "" ? undefined : num(e.target.value) })} /></Field>
      <Field label={`Próxima revisão / óleo (${v.unidade})`}><input inputMode="decimal" className="field" value={v.revisaoKm ?? ""} onChange={(e) => setV({ ...v, revisaoKm: e.target.value === "" ? undefined : num(e.target.value) })} /></Field>
      <Field label="Próxima revisão / óleo (data)"><input type="date" className="field" value={v.revisaoData ?? ""} onChange={(e) => setV({ ...v, revisaoData: e.target.value || undefined })} /></Field>
      <Field label="Medição">
        <select className="field" value={v.unidade} onChange={(e) => setV({ ...v, unidade: e.target.value as Vehicle["unidade"] })}>
          <option value="km">Quilometragem (km)</option><option value="h">Horímetro (h)</option>
        </select>
      </Field>
    </FormShell>
  );
}

/* ---------- Abastecimento ---------- */
export function FuelingForm({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Fueling | undefined }) {
  const { saveFueling, vehicles, currentMeter } = useFleet();
  const mk = () => {
    const vid = initial?.veiculoId ?? vehicles[0]?.id ?? "";
    return {
    data: initial?.data ?? today(),
    veiculoId: vid,
    inicial: String(initial?.inicial ?? (vid ? currentMeter(vid) || "" : "")),
    final: String(initial?.final ?? ""),
    litros: String(initial?.litros ?? ""),
    valor: String(initial?.valor ?? ""),
    combustivel: (initial?.combustivel ?? "Diesel") as Combustivel,
  };
  };
  const [f, setF] = useState(mk);
  useEffect(() => { if (open) setF(mk()); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const litros = num(f.litros);
  const cons = litros ? (num(f.final) - num(f.inicial)) / litros : 0;
  const unit = vehicles.find((v) => v.id === f.veiculoId)?.unidade === "h" ? "h/l" : "km/l";

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Editar abastecimento" : "Novo abastecimento"}
      onSubmit={() => saveFueling({ id: initial?.id ?? newId(), data: f.data, veiculoId: f.veiculoId, inicial: num(f.inicial), final: num(f.final), litros, valor: num(f.valor), combustivel: f.combustivel })}
    >
      <Field label="Data"><input required type="date" className="field" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Field>
      <Field label="Veículo">
        <select required className="field" value={f.veiculoId} onChange={(e) => setF({ ...f, veiculoId: e.target.value, inicial: initial ? f.inicial : String(currentMeter(e.target.value) || "") })}>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
        </select>
      </Field>
      <Field label="Combustível">
        <select className="field" value={f.combustivel} onChange={(e) => setF({ ...f, combustivel: e.target.value as Combustivel })}>
          {COMBUSTIVEIS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Km/Horímetro inicial"><input required inputMode="decimal" className="field" value={f.inicial} onChange={(e) => setF({ ...f, inicial: e.target.value })} /></Field>
      <Field label="Km/Horímetro atual (no abastecimento)"><input required inputMode="decimal" className="field" value={f.final} onChange={(e) => setF({ ...f, final: e.target.value })} /></Field>
      <Field label="Litros"><input required inputMode="decimal" className="field" value={f.litros} onChange={(e) => setF({ ...f, litros: e.target.value })} /></Field>
      <Field label="Valor total (R$)"><input required inputMode="decimal" className="field" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></Field>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Consumo calculado: <span className="font-semibold text-primary">{cons > 0 ? cons.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—"} {unit}</span>
      </p>
    </FormShell>
  );
}

/* ---------- Manutenção ---------- */
export function MaintenanceForm({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Maintenance | undefined }) {
  const { saveMaintenance, vehicles, currentMeter } = useFleet();
  const mk = () => ({
    data: initial?.data ?? today(),
    veiculoId: initial?.veiculoId ?? vehicles[0]?.id ?? "",
    tipo: initial?.tipo ?? ("Preventiva" as Maintenance["tipo"]),
    categoria: initial?.categoria ?? ("Mecânica" as Maintenance["categoria"]),
    medidor: String(initial?.medidor ?? ""),
    oficina: initial?.oficina ?? "",
    pecas: String(initial?.pecas ?? ""),
    maoDeObra: String(initial?.maoDeObra ?? ""),
    obs: initial?.obs ?? "",
  });
  const [m, setM] = useState(mk);
  useEffect(() => { if (open) setM(mk()); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = num(m.pecas) + num(m.maoDeObra);

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Editar manutenção" : "Nova manutenção"}
      onSubmit={() =>
        saveMaintenance({ id: initial?.id ?? newId(), data: m.data, veiculoId: m.veiculoId, tipo: m.tipo, categoria: m.categoria, medidor: num(m.medidor), oficina: m.oficina, pecas: num(m.pecas), maoDeObra: num(m.maoDeObra), obs: m.obs.trim() || undefined })
      }
    >
      <Field label="Data"><input required type="date" className="field" value={m.data} onChange={(e) => setM({ ...m, data: e.target.value })} /></Field>
      <Field label="Veículo">
        <select required className="field" value={m.veiculoId} onChange={(e) => setM({ ...m, veiculoId: e.target.value })}>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
        </select>
      </Field>
      <Field label="Tipo">
        <select className="field" value={m.tipo} onChange={(e) => setM({ ...m, tipo: e.target.value as Maintenance["tipo"] })}>
          <option>Preventiva</option><option>Corretiva</option><option>Revisão / Troca de óleo</option>
        </select>
      </Field>
      <Field label="Categoria">
        <select className="field" value={m.categoria} onChange={(e) => setM({ ...m, categoria: e.target.value as Maintenance["categoria"] })}>
          <option>Mecânica</option><option>Elétrica</option><option>Pneus</option><option>Hidráulica</option><option>Funilaria</option>
        </select>
      </Field>
      <Field label={`Km/Horímetro no momento (último: ${currentMeter(m.veiculoId).toLocaleString("pt-BR")})`}><input required inputMode="decimal" className="field" value={m.medidor} onChange={(e) => setM({ ...m, medidor: e.target.value })} /></Field>
      <Field label="Oficina / Fornecedor"><input required className="field" value={m.oficina} onChange={(e) => setM({ ...m, oficina: e.target.value })} /></Field>
      <Field label="Custo de peças (R$)"><input inputMode="decimal" className="field" value={m.pecas} onChange={(e) => setM({ ...m, pecas: e.target.value })} /></Field>
      <Field label="Mão de obra (R$)"><input inputMode="decimal" className="field" value={m.maoDeObra} onChange={(e) => setM({ ...m, maoDeObra: e.target.value })} /></Field>
      <label className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:col-span-2">
        Observação
        <textarea rows={3} className="field" value={m.obs} onChange={(e) => setM({ ...m, obs: e.target.value })} />
      </label>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Custo total: <span className="font-semibold text-primary">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
      </p>
    </FormShell>
  );
}
