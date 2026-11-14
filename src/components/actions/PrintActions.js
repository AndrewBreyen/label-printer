import React from 'react';

export default function PrintActions({
  connected,
  busy,
  disabled,
  status,
  onConnect,
  onDisconnect,
  onPrint,
}) {
  return (
    <section className="printer-toolbar" aria-label="Printer actions">
      <div className="printer-toolbar-status">
        <p className="eyebrow">PRINTER</p>
        <div className={`connection-state${connected ? ' is-connected' : ''}`}>
          <span className="connection-dot" />
          {connected ? 'Printer connected' : 'Printer not connected'}
        </div>
      </div>
      <div className="actions">
        {!connected ? (
          <button
            type="button"
            className="button button--secondary"
            onClick={onConnect}
            disabled={busy}
          >
            {busy ? 'Connecting...' : 'Connect Printer'}
          </button>
        ) : (
          <button
            type="button"
            className="button button--secondary"
            onClick={onDisconnect}
            disabled={busy}
          >
            Disconnect
          </button>
        )}
        <button
          type="button"
          className="button button--primary"
          onClick={onPrint}
          disabled={disabled}
        >
          Print Label
        </button>
      </div>
      {status && <p className="status-message" role="status">{status}</p>}
    </section>
  );
}
