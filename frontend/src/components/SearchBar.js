import { useRecipes } from '../contexts/RecipeContext';
import {
  SearchContainer,
  SearchInputWrapper,
  SearchInput,
  SearchButton,
  ErrorMessage,
} from './SearchBar.styles';

export default function SearchBar() {
  const { state, searchRecipes, updateSearchTerm } = useRecipes();

  const handleSubmit = (e) => {
    e.preventDefault();
    searchRecipes(state.searchTerm, 1);
  };

  return (
    <SearchContainer onSubmit={handleSubmit}>
      <SearchInputWrapper>
        <SearchInput
          type="text"
          value={state.searchTerm}
          onChange={(e) => updateSearchTerm(e.target.value)}
          placeholder="Buscar receitas, ingredientes ou estilos..."
          aria-label="Buscar receitas"
        />
        <SearchButton type="submit" disabled={state.loading || !state.searchTerm.trim()}>
          {state.loading ? 'Buscando...' : 'Buscar'}
        </SearchButton>
      </SearchInputWrapper>
      {state.validationError && <ErrorMessage>{state.validationError}</ErrorMessage>}
    </SearchContainer>
  );
}
