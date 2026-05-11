import { useEffect } from 'react';
import { RecipeProvider, useRecipes } from './contexts/RecipeContext';
import SearchBar from './components/SearchBar';
import RecipeCard from './components/RecipeCard';
import RecipeDetails from './components/RecipeDetails';
import {
  AppContainer,
  Shell,
  HeroPanel,
  Badge,
  StatusBar,
  ResultsPanel,
  RecipeGrid,
  EmptyState,
  Pagination,
} from './components/App.styles';

function AppContent() {
  const { state, searchRecipes } = useRecipes();
  const { recipes, loading, error, page, lastPage } = state;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    searchRecipes('pasta', 1);
  }, []);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > lastPage) return;
    searchRecipes(state.searchTerm, nextPage);
  };

  return (
    <AppContainer>
      <Shell>
        <HeroPanel>
          <div>
            <Badge>MyRecipeHub</Badge>
            <h1>Encontre receitas deliciosas em segundos</h1>
            <p>
              Pesquise por pratos, ingredientes ou estilos e abra receitas completas com detalhes do prato, ingredientes e instruções.
            </p>
          </div>
          <SearchBar />
          <StatusBar>
            {loading ? (
              <span>Carregando receitas...</span>
            ) : error ? (
              <span className="error-message">{error}</span>
            ) : (
              <span>{recipes.length} receitas encontradas</span>
            )}
          </StatusBar>
        </HeroPanel>

        <ResultsPanel>
          {recipes.length > 0 ? (
            <RecipeGrid>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </RecipeGrid>
          ) : (
            !loading && !error && <EmptyState>Nenhuma receita encontrada. Tente outro termo.</EmptyState>
          )}

          {lastPage > 1 && (
            <Pagination>
              <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1 || loading}>
                Anterior
              </button>
              <span>
                Página {page} de {lastPage}
              </span>
              <button onClick={() => handlePageChange(page + 1)} disabled={page >= lastPage || loading}>
                Próxima
              </button>
            </Pagination>
          )}
        </ResultsPanel>
      </Shell>

      <RecipeDetails />
    </AppContainer>
  );
}

function App() {
  return (
    <RecipeProvider>
      <AppContent />
    </RecipeProvider>
  );
}

export default App;
