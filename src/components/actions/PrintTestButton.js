import React from 'react';

export default function PrintTestButton({ connected, busy, onClick }) {
  return (
    <button
      type="button"
      className="footer-test-button"
      onClick={onClick}
      disabled={busy || !connected}
    >
      Print ruler test
    </button>
  );
}
