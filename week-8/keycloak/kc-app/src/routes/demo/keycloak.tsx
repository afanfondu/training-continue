import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../../integrations/keycloak/root-provider";

export const Route = createFileRoute("/demo/keycloak")({
  component: KeycloakDemo,
});

function KeycloakDemo() {
  const auth = useAuth();

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <section className="island-shell mt-6 rounded-2xl p-6">
        <pre>{JSON.stringify(auth.state, null, 2)}</pre>
      </section>
    </main>
  );
}
