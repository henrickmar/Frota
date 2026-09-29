import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = await signIn(username, password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="ambient-glow pointer-events-none fixed inset-0" />
      <div className="glass-panel relative w-full max-w-sm p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
            FV
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold">FrotaViva</p>
            <p className="text-xs text-muted-foreground">Gestão de frota</p>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold">Entrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesse com seu usuário e senha.</p>

        {!supabaseConfigured && (
          <p className="mt-4 rounded-xl bg-warning/15 p-3 text-xs text-warning">
            Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Usuário</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="field w-full !pl-9"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoFocus
                required
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Senha</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="field w-full !px-9"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
