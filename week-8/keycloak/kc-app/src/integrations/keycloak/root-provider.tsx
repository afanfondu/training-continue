import { env } from "#/env";
import Keycloak, {
  type KeycloakLoginOptions,
  type KeycloakLogoutOptions,
} from "keycloak-js";
import {
  useContext,
  createContext,
  useRef,
  useEffect,
  useCallback,
  useState,
} from "react";

if (
  !env.VITE_KEYCLOAK_URL ||
  !env.VITE_KEYCLOAK_REALM ||
  !env.VITE_KEYCLOAK_CLIENT_ID
) {
  console.error(
    "Missing Keycloak configuration. Please set VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, and VITE_KEYCLOAK_CLIENT_ID environment variables.",
  );
}

let keycloak: Keycloak | null = null;

const createKeycloakClient = () => {
  if (keycloak) return keycloak;

  keycloak = new Keycloak({
    url: env.VITE_KEYCLOAK_URL!,
    realm: env.VITE_KEYCLOAK_REALM!,
    clientId: env.VITE_KEYCLOAK_CLIENT_ID!,
  });

  return keycloak;
};

type KeycloakAuthValue = {
  login: (options?: KeycloakLoginOptions) => Promise<void>;
  logout: (options?: KeycloakLogoutOptions) => Promise<void>;
  state: Keycloak | undefined;
};

const KeycloakContext = createContext<KeycloakAuthValue | null>(null);

export default function KeycloakProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const keycloakRef = useRef<Keycloak | null>(keycloak);
  const [state, setState] = useState<Keycloak | undefined>();

  useEffect(() => {
    async function initializeKeycloak() {
      const keycloakClient = createKeycloakClient();

      try {
        await keycloakClient.init({ onLoad: "check-sso" });
        keycloakRef.current = keycloakClient;
        setState(keycloakClient);
      } catch (error) {
        console.log("init keycloak error", error);
      }
    }

    initializeKeycloak();
  }, []);

  const login = useCallback(async (options?: KeycloakLoginOptions) => {
    const keycloak = keycloakRef.current;
    if (!keycloak) {
      return;
    }

    await keycloak.login(options);
  }, []);

  const logout = useCallback(async (options?: KeycloakLogoutOptions) => {
    const keycloak = keycloakRef.current;
    if (!keycloak) {
      return;
    }

    await keycloak.logout(options);
  }, []);

  return (
    <KeycloakContext.Provider value={{ login, logout, state }}>
      {children}
    </KeycloakContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(KeycloakContext);
  if (!context) {
    throw new Error("useAuth must be used within a KeycloakProvider");
  }
  return context;
};
