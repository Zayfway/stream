import React from 'react';

/**
 * Slow-drifting "northern lights behind frosted glass" backdrop.
 * Pulls its colors from the live theme (--brand / --brand-2), so it
 * re-tints automatically with every theme. Render as the first child of a
 * `relative` page wrapper, with the real content layered `relative z-10` above.
 */
const Aurora: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`aurora ${className}`} aria-hidden="true">
    <span className="a1" />
    <span className="a2" />
    <span className="a3" />
  </div>
);

export default Aurora;
