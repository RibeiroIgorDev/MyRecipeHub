import React from 'react';
import './SearchBar.css';

export default function SearchBar({ searchTerm, onSearchTermChange, onSubmit, loading }) {
  return (
    <form className="search-bar" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder="Buscar receitas, ingredientes ou estilos..."
        aria-label="Buscar receitas"
      />
      <button type="submit" disabled={loading || !searchTerm.trim()}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </form>
  );
}
