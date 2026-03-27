import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "#/integrations/keycloak/root-provider";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const { state } = useAuth();
  const authenticated = Boolean(state?.authenticated);

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Keycloak Integration Workspace</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Ship secure auth-first frontend flows.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          This app is intentionally trimmed to Keycloak auth and protected API
          integration, so you can wire your NestJS backend with minimal noise.
        </p>
        <p className="mb-6 text-sm font-semibold text-[var(--sea-ink-soft)]">
          Session status: {state ? (authenticated ? "Authenticated" : "Not authenticated") : "Initializing"}
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/demo/keycloak"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Open Keycloak Session View
          </a>
          <a
            href="/demo/protected-api"
            className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
          >
            Test Protected API Call
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["OIDC Login", "Authenticate users with Keycloak using Authorization Code + PKCE."],
          ["Token-Aware UI", "Inspect auth state and keep route-level UX auth-centric."],
          ["API Bearer Flow", "Call protected NestJS endpoints with Bearer tokens."],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
              {title}
            </h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">Next Steps</p>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
          <li>
            Configure <code>.env.local</code> with Keycloak values and verify
            login/logout on <code>/demo/keycloak</code>.
          </li>
          <li>
            Set <code>VITE_API_BASE_URL</code> to your NestJS API URL and test
            <code>/demo/protected-api</code>.
          </li>
          <li>
            Use roles/scopes in Keycloak token claims to conditionally render
            protected feature UI.
          </li>
        </ul>
      </section>
    </main>
  );
}
