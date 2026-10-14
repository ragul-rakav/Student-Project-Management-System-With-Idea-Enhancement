import React from 'react';
import Icon from './Icons';

export default function RandomFillButton({ onFill, label = 'Auto-Fill (Testing)', title = 'Fill form with realistic academic test data' }) {
  return (
    <button
      type="button"
      className="btn-random-fill"
      onClick={onFill}
      title={title}
      aria-label={title}
    >
      <Icon name="dice" size={14} />
      <span>{label}</span>
    </button>
  );
}
