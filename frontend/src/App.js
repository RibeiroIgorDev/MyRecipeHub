import { useEffect, useState } from 'react';
import { RecipeProvider, useRecipes } from './contexts/RecipeContext';
import SearchBar from './components/SearchBar';
import RecipeCard from './components/RecipeCard';
import RecipeDetails from './components/RecipeDetails';
import LoginForm from './components/LoginForm';
import ResourceManager from './components/ResourceManager';
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

const AUTH_SERVICE_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:3001';
const STORAGE_KEY = 'myrecipehub-auth';

function readStoredAuth() {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function AppContent({ authToken }) {
  const { state, searchRecipes } = useRecipes();
  const { recipes, loading, error, page, lastPage } = state;

  useEffect(() => {
    searchRecipes('portuguese', 1);
  }, [searchRecipes]);

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
              Pesquise por pratos, ingredientes ou estilos culinários e descubra receitas completas, com detalhes do prato, lista de ingredientes e modo de preparo.
            </p>
          </div>
          <SearchBar />
          <StatusBar>
            {loading ? (
              <span>Carregando receitas...</span>
            ) : error ? (
              <span className="error-message">{error}</span>
            ) : (
              <span>{recipes.length} receita(s) encontrada(s) nesta página</span>
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

      <ResourceManager authToken={authToken} />
      <RecipeDetails />
    </AppContainer>
  );
}

function App() {
  const [auth, setAuth] = useState(readStoredAuth);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth?.token) return;

    const validateSession = async () => {
      try {
        const response = await fetch(`${AUTH_SERVICE_URL}/me`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Sessão inválida.');
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        setAuth(null);
      }
    };

    validateSession();
  }, [auth?.token]);

  const handleLogin = async (username, password) => {
    setLoading(true);
    setAuthError('');

    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao autenticar.');
      }

      const nextAuth = { token: data.token, user: data.user };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
      setAuth(nextAuth);
    } catch (error) {
      setAuthError(error.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
    setAuthError('');
  };

  if (!auth?.token) {
    return <LoginForm onLogin={handleLogin} loading={loading} error={authError} />;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '1rem 1.5rem 0',
          color: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>Olá, {auth.user?.username || 'usuário'}</span>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: '999px',
              padding: '0.55rem 0.9rem',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>
      </div>
      <RecipeProvider>
        <AppContent authToken={auth.token} />
      </RecipeProvider>
    </div>
  );
}

export default App;
