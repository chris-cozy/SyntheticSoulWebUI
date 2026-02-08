import type { ReactNode } from "react";

type HeaderBannerProps = {
  username?: string;
  apiVersion?: string;
  authMenu: ReactNode;
};

export default function HeaderBanner({ username, apiVersion, authMenu }: HeaderBannerProps) {
  return (
    <header className="ss-header-banner">
      <div className="ss-header-status">
        <span className="ss-status-dot" aria-hidden="true" />
        <span className="ss-status-label">SECURE ACCESS // {username || "GUEST"}</span>
      </div>

      <div className="ss-header-right">
        <div className="ss-header-meta">
          <span>SYS-CONSOLE</span>
          <span>VER {apiVersion || "--"}</span>
        </div>
        <div className="ss-brand-block" aria-label="Synthetic Soul">
          <span className="ss-brand-synthetic">Synthetic</span>
          <span className="ss-brand-soul">Soul</span>
        </div>
        <div className="ss-auth-slot">{authMenu}</div>
      </div>
    </header>
  );
}
