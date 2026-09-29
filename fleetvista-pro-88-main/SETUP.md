# FrotaViva — Supabase + login + publicação

## 1) Supabase (banco + usuário)
1. Crie um projeto em https://supabase.com (grátis).
2. **SQL Editor → New query**: cole o conteúdo de `supabase/schema.sql` e rode (cria as tabelas + segurança RLS).
3. (Opcional) rode `supabase/seed.sql` para carregar os dados de exemplo.
4. **Authentication → Users → Add user → Create new user**
   - Email: `castanhel@frotaviva.app`
   - Password: a senha combinada
   - Marque **Auto Confirm User**
5. **Authentication → Sign In / Providers**: desative *Allow new users to sign up* (só o usuário criado acima entra).
6. **Project Settings → API**: copie a *Project URL* e a chave *anon public*.

Na tela de login digita-se apenas `Castanhel` (o app converte para `castanhel@frotaviva.app`).

## 2) Rodar local
```sh
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm i
npm run dev
```

## 3) Publicar na Vercel
1. Suba o projeto no GitHub.
2. Vercel → Add New → Project → importe o repositório (o framework deve aparecer como *TanStack Start*).
3. Em *Environment Variables* adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Deploy.

As variáveis `VITE_*` são embutidas no build: se mudá-las, faça um novo deploy.
