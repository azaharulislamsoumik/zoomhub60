
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Link2,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  Video,
  X,
} from "lucide-react";
import LogoutButton from "@/components/logout-button";

type AccountStatus =
  | "NOT_CONNECTED"
  | "CONNECTED"
  | "TOKEN_EXPIRED"
  | "ERROR";

type Account = {
  id: string;
  slotNumber: number;
  displayName: string;
  email: string | null;
  status: AccountStatus;
};

type Summary = {
  total: number;
  connected: number;
  notConnected: number;
  tokenExpired: number;
  errors: number;
};

const emptySummary: Summary = {
  total: 0,
  connected: 0,
  notConnected: 0,
  tokenExpired: 0,
  errors: 0,
};

const statusLabels: Record<AccountStatus, string> = {
  NOT_CONNECTED: "Not connected",
  CONNECTED: "Connected",
  TOKEN_EXPIRED: "Token expired",
  ERROR: "Error",
};

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
const [connectingId, setConnectingId] = useState<string | null>(null);
const [connectError, setConnectError] = useState("");

async function connectZoomAccount(accountId: string) {
  try {
    setConnectingId(accountId);
    setConnectError("");

    const response = await fetch("/api/zoom/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ accountId }),
    });

    const data = await response.json();

    if (!response.ok || !data.authorizationUrl) {
      throw new Error(data.error || "Unable to connect Zoom account.");
    }

    window.location.assign(data.authorizationUrl);
  } catch (error) {
    setConnectError(
      error instanceof Error
        ? error.message
        : "Unable to connect Zoom account."
    );
    setConnectingId(null);
  }
}
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All accounts");

  const [meetingLink, setMeetingLink] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [meetingConfigLoading, setMeetingConfigLoading] = useState(true);
  const [meetingSaving, setMeetingSaving] = useState(false);
  const [meetingError, setMeetingError] = useState("");
  const [meetingSuccess, setMeetingSuccess] = useState("");
  const [hasMeetingPassword, setHasMeetingPassword] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [renameSuccess, setRenameSuccess] = useState("");
  const [connectSuccess, setConnectSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const zoomStatus = params.get("zoom");

    const messages: Record<string, string> = {
      connected: "Zoom account connected successfully.",
      authorization_denied: "Zoom authorization was cancelled or denied.",
      invalid_state: "Zoom authorization expired or was invalid. Please try again.",
      unauthorized: "Your admin session is invalid. Please log in again.",
      connection_failed: "Unable to connect Zoom account. Please try again.",
    };

    if (zoomStatus && messages[zoomStatus]) {
      if (zoomStatus === "connected") {
        setConnectSuccess(messages[zoomStatus]);
      } else {
        setConnectError(messages[zoomStatus]);
      }

      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccounts() {
      try {
        setLoading(true);
        setApiError("");

        const response = await fetch("/api/accounts", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
          }

          throw new Error("Unable to load account profiles.");
        }

        const data = await response.json();

        if (!Array.isArray(data.accounts) || !data.summary) {
          throw new Error("Invalid account data received from server.");
        }

        setAccounts(data.accounts);
        setSummary(data.summary);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setApiError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading accounts."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAccounts();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMeetingConfig() {
      try {
        setMeetingConfigLoading(true);
        setMeetingError("");

        const response = await fetch("/api/meeting-config", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load meeting configuration."
          );
        }

        setMeetingLink(data.config?.meetingLink || "");
        setMeetingId(data.config?.meetingId || "");
        setHasMeetingPassword(
          Boolean(data.config?.hasMeetingPassword)
        );
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setMeetingError(
          error instanceof Error
            ? error.message
            : "Unable to load meeting configuration."
        );
      } finally {
        if (!controller.signal.aborted) {
          setMeetingConfigLoading(false);
        }
      }
    }

    loadMeetingConfig();

    return () => controller.abort();
  }, []);

  async function saveMeetingConfig() {
    try {
      setMeetingSaving(true);
      setMeetingError("");
      setMeetingSuccess("");

      const response = await fetch("/api/meeting-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          meetingLink,
          meetingId,
          meetingPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save meeting configuration."
        );
      }

      setHasMeetingPassword(
        Boolean(data.config?.hasMeetingPassword)
      );
      setShowPassword(false);
      setSaved(true);
      setMeetingSuccess("Meeting configuration saved securely.");
    } catch (error) {
      setMeetingError(
        error instanceof Error
          ? error.message
          : "Unable to save meeting configuration."
      );
    } finally {
      setMeetingSaving(false);
    }
  }

  function startRename(account: Account) {
    setEditingId(account.id);
    setEditName(account.displayName);
    setRenameError("");
    setRenameSuccess("");
  }

  function cancelRename() {
    setEditingId(null);
    setEditName("");
    setRenameError("");
  }

  async function saveRename(accountId: string) {
    const displayName = editName.trim();

    if (displayName.length < 2 || displayName.length > 50) {
      setRenameError("Name must be 2-50 characters long.");
      return;
    }

    try {
      setRenaming(true);
      setRenameError("");
      setRenameSuccess("");

      const response = await fetch("/api/accounts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: accountId,
          displayName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to rename account.");
      }

      setAccounts((current) =>
        current.map((account) =>
          account.id === accountId
            ? {
                ...account,
                displayName: data.account.displayName,
              }
            : account
        )
      );

      setEditingId(null);
      setEditName("");
      setRenameSuccess("Account name updated successfully.");
    } catch (error) {
      setRenameError(
        error instanceof Error
          ? error.message
          : "Unable to rename account."
      );
    } finally {
      setRenaming(false);
    }
  }

  const filtered = useMemo(
    () =>
      accounts.filter((account) => {
        const matchesSearch =
          `${account.displayName} ${account.email ?? ""} ${account.slotNumber}`
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesFilter =
          filter === "All accounts" ||
          statusLabels[account.status] === filter;

        return matchesSearch && matchesFilter;
      }),
    [accounts, search, filter]
  );

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Video size={21} />
          </div>
          <div>
            <strong>
              ZoomHub <span>60</span>
            </strong>
            <small>ACCOUNT CONTROL CENTER</small>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-icon">ZH</div>
          <div>
            <b>Workspace</b>
            <small>Administrator</small>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="nav-label">WORKSPACE</div>

        <a className="nav-item active">
          <Activity size={17} /> Overview
        </a>

        <a className="nav-item">
          <Video size={17} /> Meeting Settings
        </a>


        <div className="nav-label space-top">PREFERENCES</div>

        <a className="nav-item">
          <Settings2 size={17} /> Settings
        </a>

        <a className="nav-item">
          <CircleHelp size={17} /> Help & Support
        </a>

        <div className="sidebar-bottom">
          <div className="secure">
            <ShieldCheck size={17} />
            <div>
              <b>Secure workspace</b>
              <small>Account tokens stay protected</small>
            </div>
          </div>

          <div className="user-row">
            <div className="avatar">AD</div>
            <div>
              <b>Administrator</b>
              <small>Workspace owner</small>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <b>Overview</b>
          </div>

          <div className="top-actions">
            <span className="env">
              <i /> Development
            </span>
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="avatar small">AD</div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">ACCOUNT OPERATIONS</div>
              <h1>Overview</h1>
              <p>
                Manage your authorized Zoom account connections from one place.
              </p>
            </div>

            <button
              className="primary-btn"
              onClick={() =>
                document
                  .getElementById("meeting-settings")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Plus size={16} /> Configure meeting
            </button>
          </div>

          {apiError && (
            <div className="demo-warning" role="alert">
              {apiError}
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Total profiles</span>
                <div className="stat-icon purple">
                  <Users size={18} />
                </div>
              </div>
              <strong>{loading ? "—" : summary.total}</strong>
              <small>Available account slots</small>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Connected accounts</span>
                <div className="stat-icon green">
                  <Check size={18} />
                </div>
              </div>
              <strong>{loading ? "—" : summary.connected}</strong>
              <small>Authorized Zoom accounts</small>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Not connected</span>
                <div className="stat-icon amber">
                  <Clock3 size={18} />
                </div>
              </div>
              <strong>{loading ? "—" : summary.notConnected}</strong>
              <small>Awaiting account authorization</small>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Meeting configuration</span>
                <div className="stat-icon blue">
                  <Link2 size={18} />
                </div>
              </div>
              <strong className="stat-word">Not set</strong>
              <small>Central meeting details</small>
            </div>
          </div>

          <section className="panel meeting-panel" id="meeting-settings">
            <div className="panel-heading">
              <div>
                <div className="section-icon">
                  <Video size={18} />
                </div>
                <div>
                  <h2>Central meeting configuration</h2>
                  <p>
                    Enter meeting details once. They are shared as reference
                    data across the workspace.
                  </p>
                </div>
              </div>

              <span className="central-tag">
                <LockKeyhole size={13} /> CENTRALIZED
              </span>
            </div>

            <div className="meeting-form">
              <label className="field wide">
                <span>Meeting link</span>
                <input
                  value={meetingLink}
                  onChange={(e) => {
                    setMeetingLink(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="https://zoom.us/j/123456789"
                />
              </label>

              <label className="field">
                <span>Meeting ID</span>
                <input
                  value={meetingId}
                  onChange={(e) => {
                    setMeetingId(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="Enter meeting ID"
                />
              </label>

              <label className="field">
                <span>Meeting password</span>
                <div className="password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={meetingPassword}
                    onChange={(e) => {
                      setMeetingPassword(e.target.value);
                      setSaved(false);
                    }}
                    placeholder="Enter meeting password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            </div>

            <div className="panel-footer">
              <span className="muted-note">
                <LockKeyhole size={14} />
                Password is encrypted before database storage.
                {hasMeetingPassword ? " A password is already saved." : ""}
              </span>

              <button
                className="secondary-btn"
                onClick={saveMeetingConfig}
                disabled={meetingSaving || meetingConfigLoading}
              >
                <Check size={15} />
                {meetingSaving
                  ? "Saving..."
                  : saved
                    ? "Saved securely"
                    : "Save configuration"}
              </button>
            </div>

            {meetingConfigLoading && (
              <p className="muted-note">Loading saved meeting configuration...</p>
            )}

            {meetingError && (
              <p role="alert" className="error-message">{meetingError}</p>
            )}

            {meetingSuccess && (
              <p role="status" className="success-message">{meetingSuccess}</p>
            )}
          </section>

          <section className="panel accounts-panel">
            <div className="accounts-heading">
              <div>
                <h2>
                  Account profiles{" "}
                  <span className="count-pill">
                    {loading ? "..." : summary.total}
                  </span>
                </h2>
                <p>
                  Each profile requires its own authorized Zoom account
                  connection.
                </p>
              </div>

              <button
                className="outline-btn"
                disabled
                title="Account authorization will be designed after OAuth is implemented"
              >
                <Plus size={15} /> Add account
              </button>
            </div>

            <div className="toolbar">
              <div className="search-box">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search account profiles..."
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>All accounts</option>
                <option>Connected</option>
                <option>Not connected</option>
                <option>Token expired</option>
                <option>Error</option>
              </select>

              <span className="result-count">
                {loading
                  ? "Loading accounts..."
                  : `Showing ${filtered.length} of ${summary.total}`}
              </span>
            </div>

            {renameSuccess && (
              <div className="rename-success" role="status">
                {renameSuccess}
              </div>
            )}
            {connectSuccess && (
              <div className="rename-success" role="status">
                {connectSuccess}
              </div>
            )}

            {loading && (
              <div className="empty-state">
                Loading account profiles...
              </div>
            )}

            {!loading && !apiError && (
              <>
                <div className="account-grid">
                  {filtered.map((account) => (
                    <article
                      className="account-card"
                      key={account.id}
                    >
                      <div className="account-card-top">
                        <div className="account-avatar">
                          {String(account.slotNumber).padStart(2, "0")}
                        </div>

                        <span className="status-dot">
                          <i /> {statusLabels[account.status]}
                        </span>
                      </div>

                      {editingId === account.id ? (
                        <div className="rename-section">
                          <input
                            className="rename-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            maxLength={50}
                            autoFocus
                            disabled={renaming}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveRename(account.id);
                              }

                              if (e.key === "Escape") {
                                cancelRename();
                              }
                            }}
                            placeholder="Enter account name"
                          />

                          <div className="rename-actions">
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() => saveRename(account.id)}
                              disabled={renaming}
                            >
                              <Check size={14} />
                              {renaming ? "Saving..." : "Save"}
                            </button>

                            <button
                              type="button"
                              className="icon-btn"
                              onClick={cancelRename}
                              disabled={renaming}
                              aria-label="Cancel rename"
                            >
                              <X size={15} />
                            </button>
                          </div>

                          {renameError && (
                            <p className="rename-error" role="alert">
                              {renameError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="account-name-row">
                          <h3>{account.displayName}</h3>

                          <button
                            type="button"
                            className="rename-btn"
                            onClick={() => startRename(account)}
                            title="Rename account"
                            aria-label={`Rename ${account.displayName}`}
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      )}

                      <p className="account-email">
                        {account.email ?? "Not authorized yet"}
                      </p>

                      <div className="account-divider" />

                      <div className="account-meta">
                        <span>Meeting settings</span>
                        <b>
                          {meetingId
                            ? `ID ••••${meetingId.slice(-4)}`
                            : "Not configured"}
                        </b>
                      </div>

                   <button
  className="connect-btn"
  onClick={() => connectZoomAccount(account.id)}
  disabled={connectingId !== null}
>
  {connectingId === account.id
    ? "Connecting..."
    : account.status === "CONNECTED"
      ? "Reconnect Zoom account"
      : "Connect Zoom account"}
  <ArrowUpRight size={14} />
</button>
{connectError && (
  <p className="rename-error" role="alert">
    {connectError}
  </p>
)}
                    </article>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="empty-state">
                    No profiles match your search.
                  </div>
                )}
              </>
            )}
          </section>

          <footer className="footer">
            <span>
              ZoomHub 60 <span className="dot-sep">•</span> Development build
              v0.1.0
            </span>
            <span>Authorized account management only</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
