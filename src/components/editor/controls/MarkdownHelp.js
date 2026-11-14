import React from 'react';

export default function MarkdownHelp() {
  return (
    <p className="hint">
      <code># text</code> = big heading, <code>## text</code> = smaller heading, plain text =
      body, blank line = spacing. <code>{'{{now}}'}</code> and <code>{'{{now+7d}}'}</code>{' '}
      insert live dates.
    </p>
  );
}
