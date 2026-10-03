import { useEffect, useRef, useState } from "react";

interface GoogleCredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, options: {
            theme?: "outline" | "filled_blue" | "filled_black";
            size?: "large" | "medium" | "small";
            shape?: "rectangular" | "pill" | "circle" | "square";
            text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            width?: number;
            use_fedcm_for_button?: boolean;
          }) => void;
        };
      };
    };
  }
}

interface Props {
  onCredential: (credential: string) => void;
  disabled?: boolean;
}

// This public Web client ID is also set in render.yaml and the env examples.
// Vercel's Git deployments do not receive an untracked local .env.production.
const DEFAULT_GOOGLE_CLIENT_ID = "181033328239-fpqurruvqapfc2afnf87iv3b1m378dgi.apps.googleusercontent.com";

const GoogleSignInButton = ({ onCredential, disabled = false }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const credentialHandler = useRef(onCredential);
  const disabledRef = useRef(disabled);
  const [loadFailed, setLoadFailed] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || DEFAULT_GOOGLE_CLIENT_ID;

  useEffect(() => { credentialHandler.current = onCredential; }, [onCredential]);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  useEffect(() => {
    if (!clientId || !containerRef.current) return;
    let cancelled = false;
    const container = containerRef.current;
    const renderButton = () => {
      if (cancelled || !container || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        use_fedcm_for_prompt: true,
        callback: response => {
          if (!disabledRef.current && response.credential) credentialHandler.current(response.credential);
        },
      });
      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: Math.max(120, Math.min(360, Math.floor(container.getBoundingClientRect().width))),
        use_fedcm_for_button: true,
      });
    };
    const scriptFailed = () => setLoadFailed(true);

    let script = document.querySelector<HTMLScriptElement>("script[data-google-identity]");
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      script.addEventListener("load", renderButton);
      script.addEventListener("error", scriptFailed);
      document.head.appendChild(script);
    } else if (window.google) {
      renderButton();
    } else {
      script.addEventListener("load", renderButton);
      script.addEventListener("error", scriptFailed);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderButton);
      script?.removeEventListener("error", scriptFailed);
      if (container) container.innerHTML = "";
    };
  }, [clientId]);

  if (!clientId) {
    return <p className="text-center text-xs" style={{ color: "var(--muted)" }}>Google sign-in needs a configured client ID.</p>;
  }

  return (
    <div className={`flex min-h-10 w-full justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      {loadFailed
        ? <p className="self-center text-xs" style={{ color: "var(--muted)" }}>Google sign-in could not load. Check your connection.</p>
        : <div ref={containerRef} className="w-full max-w-[360px]" />}
    </div>
  );
};

export default GoogleSignInButton;
