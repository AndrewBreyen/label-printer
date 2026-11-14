import React from 'react';
import { STOCK_GROUPS } from '../../config/appConfig';

export default function StockNavigation({
  stockGroup,
  mode,
  onSelectStockGroup,
  onSelectMode,
}) {
  const activeMode = STOCK_GROUPS.find((group) => group.id === stockGroup)?.modes.find(
    (option) => option.id === mode
  );
  const group = STOCK_GROUPS.find((item) => item.id === stockGroup);

  return (
    <>
      <nav className="stock-groups" aria-label="Paper size">
        {STOCK_GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`stock-group${stockGroup === item.id ? ' is-selected' : ''}`}
            aria-pressed={stockGroup === item.id}
            onClick={() => onSelectStockGroup(item.id)}
          >
            <span className="stock-group-title">{item.title}</span>
            <span className="stock-group-description">{item.description}</span>
          </button>
        ))}
      </nav>

      <nav className="mode-tabs" aria-label={`${activeMode?.label || 'Label'} type`}>
        {group.modes.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`mode-tab${mode === option.id ? ' is-selected' : ''}`}
            aria-pressed={mode === option.id}
            onClick={() => onSelectMode(option.id)}
          >
            {option.label}
          </button>
        ))}
      </nav>
    </>
  );
}
