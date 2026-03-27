import { createFileRoute } from "@tanstack/react-router";
import { env } from "#/env";
import { useAuth } from "#/integrations/keycloak/root-provider";
import { useState, useCallback } from "react";

export const Route = createFileRoute("/demo/protected-api")({
  component: ProtectedApiDemo,
});

type ApiEndpoint = {
  name: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  requiresAuth: boolean;
  body?: object;
  scope?: string;
  role?: string;
};

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    name: "Hello (Public)",
    method: "GET",
    path: "/",
    description: "Public endpoint - no authentication required",
    requiresAuth: false,
  },
  {
    name: "Profile",
    method: "GET",
    path: "/profile",
    description: "Returns authenticated user info",
    requiresAuth: true,
  },
  {
    name: "Admin",
    method: "GET",
    path: "/admin",
    description: "Admin-only endpoint",
    requiresAuth: true,
    role: "admin",
  },
  {
    name: "List Users",
    method: "GET",
    path: "/api/users",
    description: "List all users",
    requiresAuth: true,
    scope: "users:read",
  },
  {
    name: "Get User by ID",
    method: "GET",
    path: "/api/users/1",
    description: "Get user by ID",
    requiresAuth: true,
    scope: "users:read",
  },
  {
    name: "Create User",
    method: "POST",
    path: "/api/users",
    description: "Create a new user",
    requiresAuth: true,
    scope: "users:write",
    body: { name: "Test User", email: "test@example.com" },
  },
  {
    name: "Delete User",
    method: "DELETE",
    path: "/api/users/1",
    description: "Delete user by ID",
    requiresAuth: true,
    scope: "users:delete",
  },
];

type ApiResponse = {
  endpoint: string;
  status: number | null;
  data: unknown;
  error: string | null;
  loading: boolean;
};

function ProtectedApiDemo() {
  const auth = useAuth();
  const authState = auth.state;

  const [responses, setResponses] = useState<Record<string, ApiResponse>>({});

  const callApi = useCallback(
    async (endpoint: ApiEndpoint) => {
      const key = `${endpoint.method}-${endpoint.path}`;

      setResponses((prev) => ({
        ...prev,
        [key]: {
          endpoint: key,
          status: null,
          data: null,
          error: null,
          loading: true,
        },
      }));

      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (endpoint.requiresAuth && authState?.token) {
          headers["Authorization"] = `Bearer ${authState.token}`;
        }

        const response = await fetch(
          `${env.VITE_API_URL}${endpoint.path}`,
          {
            method: endpoint.method,
            headers,
            body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
          }
        );

        let data: unknown;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        setResponses((prev) => ({
          ...prev,
          [key]: {
            endpoint: key,
            status: response.status,
            data,
            error: null,
            loading: false,
          },
        }));
      } catch (err) {
        setResponses((prev) => ({
          ...prev,
          [key]: {
            endpoint: key,
            status: null,
            data: null,
            error: err instanceof Error ? err.message : "Unknown error",
            loading: false,
          },
        }));
      }
    },
    [authState?.token]
  );

  const callAllApis = useCallback(() => {
    API_ENDPOINTS.forEach((endpoint) => callApi(endpoint));
  }, [callApi]);

  const getStatusColor = (status: number | null) => {
    if (status === null) return "bg-[var(--surface)] text-[var(--sea-ink-soft)]";
    if (status >= 200 && status < 300) return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
    if (status >= 400 && status < 500) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500";
      case "POST":
        return "bg-green-500";
      case "DELETE":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Protected Backend Flow</p>
        <h1 className="display-title mb-4 text-3xl text-[var(--sea-ink)] sm:text-5xl">
          Keycloak bearer token to NestJS API
        </h1>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--sea-ink-soft)]">Auth Status:</span>
            {authState?.authenticated ? (
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400">
                Authenticated
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-sm font-medium text-red-700 dark:text-red-400">
                Not Authenticated
              </span>
            )}
          </div>
          <button
            onClick={callAllApis}
            className="rounded-lg bg-[var(--lagoon-deep)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)] focus:ring-offset-2"
          >
            Call All Endpoints
          </button>
        </div>

        {authState?.token && (
          <div className="mt-4 rounded-lg bg-[var(--surface)] p-4">
            <p className="mb-2 text-sm font-medium text-[var(--sea-ink)]">
              Access Token (first 50 chars):
            </p>
            <code className="block break-all rounded bg-[var(--surface-strong)] p-2 text-xs text-[var(--sea-ink)]">
              {authState.token.substring(0, 50)}...
            </code>
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {API_ENDPOINTS.map((endpoint) => {
          const key = `${endpoint.method}-${endpoint.path}`;
          const response = responses[key];

          return (
            <div
              key={key}
              className="island-shell overflow-hidden rounded-xl"
            >
              <div className="border-b border-[var(--line)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold text-white ${getMethodColor(endpoint.method)}`}
                    >
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-medium text-[var(--sea-ink)]">
                      {endpoint.path}
                    </code>
                  </div>
                  <button
                    onClick={() => callApi(endpoint)}
                    disabled={response?.loading}
                    className="rounded bg-[var(--surface)] px-3 py-1 text-sm font-medium text-[var(--sea-ink)] hover:bg-[var(--surface-strong)] disabled:opacity-50"
                  >
                    {response?.loading ? "..." : "Call"}
                  </button>
                </div>
                <p className="mt-2 text-sm text-[var(--sea-ink)]">
                  {endpoint.name}
                </p>
                <p className="text-xs text-[var(--sea-ink-soft)]">{endpoint.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!endpoint.requiresAuth && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Public
                    </span>
                  )}
                  {endpoint.requiresAuth && !endpoint.scope && !endpoint.role && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                      Authenticated
                    </span>
                  )}
                  {endpoint.role && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                      Role: {endpoint.role}
                    </span>
                  )}
                  {endpoint.scope && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Scope: {endpoint.scope}
                    </span>
                  )}
                </div>
                {endpoint.body && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-[var(--sea-ink-soft)]">
                      Body:
                    </span>
                    <code className="ml-2 text-xs text-[var(--sea-ink-soft)]">
                      {JSON.stringify(endpoint.body)}
                    </code>
                  </div>
                )}
              </div>

              {response && (
                <div className="bg-[var(--surface)] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--sea-ink-soft)]">
                      Status:
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${getStatusColor(response.status)}`}
                    >
                      {response.status ?? "Error"}
                    </span>
                  </div>
                  {response.error ? (
                    <div className="rounded bg-red-50 dark:bg-red-900/20 p-2">
                      <p className="text-xs text-red-600 dark:text-red-400">{response.error}</p>
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-auto rounded bg-[var(--surface-strong)] p-2">
                      <pre className="text-xs text-[var(--sea-ink)]">
                        {typeof response.data === "string"
                          ? response.data
                          : JSON.stringify(response.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
