import React from 'react';

// Carte ultra-légère sans animations
export function LightCard({ children, className = '', onClick }) {
  return (
    <div 
      className={`bg-white border rounded-lg p-3 ${onClick ? 'cursor-pointer active:bg-gray-50' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function LightCardHeader({ children, className = '' }) {
  return <div className={`font-medium text-sm mb-2 ${className}`}>{children}</div>;
}

export function LightCardContent({ children, className = '' }) {
  return <div className={`text-sm text-gray-600 ${className}`}>{children}</div>;
}

// Liste légère
export function LightList({ items, renderItem, emptyText = 'Aucun élément', keyExtractor }) {
  if (!items || items.length === 0) {
    return <p className="text-center text-gray-500 py-4 text-sm">{emptyText}</p>;
  }

  return (
    <div className="divide-y">
      {items.map((item, i) => (
        <div key={keyExtractor ? keyExtractor(item, i) : i} className="py-2">
          {renderItem(item, i)}
        </div>
      ))}
    </div>
  );
}

// Badge léger
export function LightBadge({ children, color = 'gray', className = '' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    pink: 'bg-pink-100 text-pink-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}

// Bouton léger
export function LightButton({ children, onClick, variant = 'primary', disabled, className = '', size = 'md' }) {
  const variants = {
    primary: 'bg-pink-500 text-white active:bg-pink-600',
    secondary: 'bg-gray-100 text-gray-700 active:bg-gray-200',
    outline: 'border border-gray-300 text-gray-700 active:bg-gray-50',
    danger: 'bg-red-500 text-white active:bg-red-600',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// Loader minimal
export function LightLoader({ text = 'Chargement...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-500">{text}</span>
    </div>
  );
}

// Input léger
export function LightInput({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        {...props}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 ${props.className || ''}`}
      />
    </div>
  );
}

// Select léger
export function LightSelect({ label, options = [], ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        {...props}
        className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-pink-500 ${props.className || ''}`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}