import React from 'react';

export default function PrinterConnection({ connected, busy, onConnect, onDisconnect }) {
  return (
    <section className="printer-toolbar" aria-label="Printer connection">
      <div className={`connection-state${connected ? ' is-connected' : ''}`}>
        <span className="connection-dot" />
        {connected ? 'Connected' : 'Disconnected'}
      </div>
      <button
        type="button"
        className="button button--secondary"
        onClick={connected ? onDisconnect : onConnect}
        disabled={busy}
      >
        {connected ? 'Disconnect' : busy ? 'Connecting...' : 'Connect Printer'}
      </button>
    </section>
  );
}
