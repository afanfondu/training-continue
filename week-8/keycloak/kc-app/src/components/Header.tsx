import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "#/integrations/keycloak/root-provider";

export default function Header() {
  const auth = useAuth();
  const authState = auth.state;
  const authenticated = Boolean(authState?.authenticated);
  const authLabel = authState
    ? authenticated
      ? "Signed in"
      : "Signed out"
    : "Checking session";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Keycloak Auth App
          </Link>
        </h2>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1 text-xs font-semibold text-[var(--sea-ink-soft)] sm:flex">
            <span
              className={`h-2 w-2 rounded-full ${authenticated ? "bg-emerald-500" : authState ? "bg-amber-500" : "bg-slate-400"}`}
            />
            {authLabel}
          </div>

          {authenticated ? (
            <button
              type="button"
              onClick={() =>
                void auth.logout({
                  redirectUri: `${window.location.origin}/demo/keycloak`,
                })
              }
              className="rounded-xl border border-[rgba(216,74,74,0.35)] bg-[rgba(216,74,74,0.12)] px-3 py-1.5 text-xs font-semibold text-[rgb(154,42,42)] transition hover:bg-[rgba(216,74,74,0.2)]"
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                void auth.login({
                  redirectUri: `${window.location.origin}/demo/keycloak`,
                })
              }
              disabled={!authState}
              className="rounded-xl border border-[rgba(36,129,120,0.35)] bg-[rgba(79,184,178,0.16)] px-3 py-1.5 text-xs font-semibold text-[var(--lagoon-deep)] transition hover:bg-[rgba(79,184,178,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Login
            </button>
          )}

          <ThemeToggle />
        </div>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
          {/* <Link */}
          {/*   to="/" */}
          {/*   className="nav-link" */}
          {/*   activeProps={{ className: "nav-link is-active" }} */}
          {/* > */}
          {/*   Auth Home */}
          {/* </Link> */}
          <Link
            to="/demo/keycloak"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Keycloak Session
          </Link>
          <Link
            to="/demo/protected-api"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Protected API
          </Link>
        </div>
      </nav>
    </header>
  );
}
