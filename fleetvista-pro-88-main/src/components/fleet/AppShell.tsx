import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Fuel, LayoutDashboard, LogOut, Menu, Moon, Sun, Truck, Wrench, X } from "lucide-react";
import { useFleet } from "@/lib/fleet-store";
import { useAuth } from "@/lib/auth";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/frota", label: "Frota", icon: Truck },
  { to: "/abastecimentos", label: "Abastecimentos", icon: Fuel },
  { to: "/manutencoes", label: "Manutenções", icon: Wrench },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-glass text-muted-foreground transition-colors hover:text-foreground"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <button
      onClick={() => void signOut()}
      aria-label="Sair"
      title="Sair"
      className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-glass text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut className="size-4" />
    </button>
  );
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { vehicles } = useFleet();
  const inMaint = vehicles.filter((v) => v.status === "Manutenção");
  return (
    <div className="flex h-full flex-col gap-1 p-5">
      <div className="mb-6 flex items-center gap-3 px-1 py-2">
        <div className="grid size-9 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
          FV
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">FrotaViva</p>
          <p className="text-[11px] text-muted-foreground">Gestão de frota</p>
        </div>
      </div>
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Operação
      </p>
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: true }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          activeProps={{
            className: "!bg-accent !text-foreground font-medium ring-1 ring-border",
          }}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
      {inMaint.length > 0 && (
        <div className="mt-auto rounded-2xl border border-border bg-accent p-4">
          <p className="text-[11px] text-muted-foreground">Em manutenção agora</p>
          <p className="mt-1 font-display font-semibold">{inMaint[0]!.nome}</p>
          <p className="mt-0.5 text-[11px] text-primary">{inMaint[0]!.categoria}</p>
        </div>
      )}
    </div>
  );
}

export function AppShell({
  eyebrow,
  title,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="ambient-glow pointer-events-none fixed inset-0" />
      <div className="relative flex min-h-screen">
        <aside className="glass-panel sticky top-0 hidden h-screen w-[248px] shrink-0 !rounded-none !border-y-0 !border-l-0 lg:block">
          <SideNav />
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-[260px] border-r border-border bg-popover">
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="absolute right-3 top-4 text-muted-foreground"
              >
                <X className="size-5" />
              </button>
              <SideNav onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                aria-label="Abrir menu"
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-glass lg:hidden"
              >
                <Menu className="size-4" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
                <h1 className="mt-1 truncate text-2xl font-bold sm:text-[28px]">{title}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <ThemeToggle />
              <LogoutButton />
            </div>
          </header>
          <div className="mt-6 space-y-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
