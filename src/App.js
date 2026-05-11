import { useEffect, useState } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import RecipeCard from './components/RecipeCard';
import RecipeDetails from './components/RecipeDetails';
import { getRecipeDetail, searchRecipes } from './services/recipeApi';

function App() {
  const [searchTerm, setSearchTerm] = useState('pasta');
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const loadRecipes = async (query, pageNumber = 1) => {
    setError('');
    setLoading(true);
    try {
      const response = await searchRecipes(query, pageNumber, 12);
      setRecipes(response.data || []);
      setPage(response.meta?.current_page || pageNumber);
      setLastPage(response.meta?.last_page || 1);
    } catch (fetchError) {
      setRecipes([]);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes('pasta', 1);
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setSelectedRecipe(null);
    loadRecipes(searchTerm.trim(), 1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > lastPage) return;
    loadRecipes(searchTerm.trim(), nextPage);
  };

  const handleSelectRecipe = async (recipe) => {
    setError('');
    setDetailLoading(true);
    try {
      const response = await getRecipeDetail(recipe.id);
      setSelectedRecipe(response.data || recipe);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="App">
      <main className="App-shell">
        <section className="hero-panel">
          <div>
            <span className="badge">MyRecipeHub</span>
            <h1>Encontre receitas deliciosas em segundos</h1>
            <p>
              Pesquise por pratos, ingredientes ou estilos e abra receitas completas com
              ingredientes, instruções e informações nutricionais.
            </p>
          </div>
          <SearchBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSubmit={handleSearch}
            loading={loading}
          />
          <div className="status-bar">
            {loading ? (
              <span>Carregando receitas...</span>
            ) : error ? (
              <span className="error-message">{error}</span>
            ) : (
              <span>{recipes.length} receitas encontradas</span>
            )}
          </div>
        </section>

        <section className="results-panel">
          {recipes.length > 0 ? (
            <div className="recipe-grid">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onSelect={handleSelectRecipe} />
              ))}
            </div>
          ) : (
            !loading && !error && <p className="empty-state">Nenhuma receita encontrada. Tente outro termo.</p>
          )}

          {lastPage > 1 && (
            <div className="pagination">
              <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1 || loading}>
                Anterior
              </button>
              <span>
                Página {page} de {lastPage}
              </span>
              <button onClick={() => handlePageChange(page + 1)} disabled={page >= lastPage || loading}>
                Próxima
              </button>
            </div>
          )}
        </section>
      </main>

      {(selectedRecipe || detailLoading) && (
        <RecipeDetails recipe={selectedRecipe} loading={detailLoading} onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  );
}

export default App;
