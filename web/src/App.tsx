import { Database, ShieldCheck, UploadCloud } from 'lucide-react';
import { isSupabaseConfigured } from './backend/supabaseClient';

const foundations = [
  {
    icon: <Database size={22} aria-hidden="true" />,
    title: 'Supabase relacional',
    text: 'Despesas, categorias, carteiras e configuracoes passam a ser linhas relacionais com RLS.'
  },
  {
    icon: <ShieldCheck size={22} aria-hidden="true" />,
    title: 'Auth e seguranca',
    text: 'Cada tabela privada pertence ao usuario autenticado e e protegida por policies.'
  },
  {
    icon: <UploadCloud size={22} aria-hidden="true" />,
    title: 'Migracao guiada',
    text: 'O export JSON version 10 do app atual sera usado como ponte para a versao 2.0.'
  }
];

export function App() {
  return (
    <main className="app-shell">
      <section className="intro">
        <p className="eyebrow">Finance Control 2.0</p>
        <h1>Fundacao do novo My Finance Control</h1>
        <p>
          Esta base preserva React, Vite e TypeScript, mas troca o centro de gravidade do app:
          IndexedDB deixa de ser a fonte de verdade e o Supabase Postgres assume o modelo relacional.
        </p>
        <span className={isSupabaseConfigured() ? 'status ready' : 'status'}>
          {isSupabaseConfigured() ? 'Supabase configurado' : 'Aguardando variaveis Supabase'}
        </span>
      </section>

      <section className="foundation-grid" aria-label="Fundacoes tecnicas">
        {foundations.map((item) => (
          <article key={item.title}>
            {item.icon}
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

