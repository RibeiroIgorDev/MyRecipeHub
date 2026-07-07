import React, { createContext, useReducer, useCallback, useEffect } from 'react';

export const RecipeContext = createContext();

const RESOURCE_SERVICE_URL = process.env.REACT_APP_RESOURCE_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'ws://localhost:3004';

const initialState = {
  recipes: [],
  selectedRecipe: null,
  loading: false,
  error: '',
  searchTerm: 'bolo de cenoura',
  page: 1,
  lastPage: 1,
  validationError: '',
};

const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_RECIPES: 'SET_RECIPES',
  SET_ERROR: 'SET_ERROR',
  SET_VALIDATION_ERROR: 'SET_VALIDATION_ERROR',
  SET_SELECTED_RECIPE: 'SET_SELECTED_RECIPE',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  SET_PAGE: 'SET_PAGE',
  SET_PAGINATION: 'SET_PAGINATION',
  RESET_VALIDATION_ERROR: 'RESET_VALIDATION_ERROR',
  ADD_RECIPE: 'ADD_RECIPE',
  UPDATE_RECIPE: 'UPDATE_RECIPE',
  REMOVE_RECIPE: 'REMOVE_RECIPE',
};

function recipeReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.SET_RECIPES:
      return { ...state, recipes: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actionTypes.SET_VALIDATION_ERROR:
      return { ...state, validationError: action.payload };
    case actionTypes.SET_SELECTED_RECIPE:
      return { ...state, selectedRecipe: action.payload };
    case actionTypes.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };
    case actionTypes.SET_PAGE:
      return { ...state, page: action.payload };
    case actionTypes.SET_PAGINATION:
      return { ...state, page: action.payload.page, lastPage: action.payload.lastPage };
    case actionTypes.RESET_VALIDATION_ERROR:
      return { ...state, validationError: '' };
    case actionTypes.ADD_RECIPE:
      return { ...state, recipes: [normalizeRecipe(action.payload), ...state.recipes] };
    case actionTypes.UPDATE_RECIPE:
      return {
        ...state,
        recipes: state.recipes.map((r) => (r.id === action.payload.id ? normalizeRecipe(action.payload) : r)),
      };
    case actionTypes.REMOVE_RECIPE:
      return {
        ...state,
        recipes: state.recipes.filter((r) => r.id !== action.payload),
        selectedRecipe: state.selectedRecipe?.id === action.payload ? null : state.selectedRecipe,
      };
    default:
      return state;
  }
}

function normalizeRecipe(resource) {
  const title = resource?.title || resource?.name || 'Receita sem título';
  const description = resource?.description || resource?.summary || 'Descrição não informada.';

  return {
    id: resource?._id || resource?.id,
    name: title,
    description,
    cuisine: resource?.cuisine || '',
    diet: resource?.diet || '',
    meal_type: resource?.meal_type || '',
    prep_time: resource?.prep_time || null,
    cook_time: resource?.cook_time || null,
    servings: resource?.servings || null,
    ingredients: Array.isArray(resource?.ingredients)
      ? resource.ingredients
      : resource?.ingredients
        ? [resource.ingredients]
        : [],
    instructions: Array.isArray(resource?.instructions)
      ? resource.instructions
      : resource?.instructions
        ? [resource.instructions]
        : [description],
    nutrition: resource?.nutrition || {},
    image: resource?.image || resource?.photo || '',
    raw: resource,
  };
}

export function RecipeProvider({ children, authToken }) {
  const [state, dispatch] = useReducer(recipeReducer, initialState);

  const getAuthHeaders = useCallback(() => {
    if (!authToken) {
      throw new Error('É necessário estar autenticado para consultar receitas.');
    }

    return {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };
  }, [authToken]);

  const handleApiResponse = useCallback(async (response) => {
    const data = await response.json();
    if (!response.ok) {
      const message = data?.error || 'Falha ao buscar dados no backend local.';
      throw new Error(message);
    }
    return data;
  }, []);

  const searchRecipes = useCallback(async (query, pageNumber = 1) => {
    if (!query || !query.trim()) {
      dispatch({ type: actionTypes.SET_VALIDATION_ERROR, payload: 'Campo de busca é obrigatório.' });
      return;
    }

    dispatch({ type: actionTypes.RESET_VALIDATION_ERROR });
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    dispatch({ type: actionTypes.SET_ERROR, payload: '' });

    try {
      const response = await fetch(`${RESOURCE_SERVICE_URL}/resources?q=${encodeURIComponent(query.trim())}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await handleApiResponse(response);
      const recipes = Array.isArray(result.data) ? result.data.map(normalizeRecipe) : [];

      dispatch({ type: actionTypes.SET_RECIPES, payload: recipes });
      dispatch({
        type: actionTypes.SET_PAGINATION,
        payload: {
          page: pageNumber,
          lastPage: 1,
        },
      });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_RECIPES, payload: [] });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [getAuthHeaders, handleApiResponse]);

  const getRecipeDetail = useCallback(async (recipeId) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    dispatch({ type: actionTypes.SET_ERROR, payload: '' });

    try {
      const response = await fetch(`${RESOURCE_SERVICE_URL}/resources/${recipeId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await handleApiResponse(response);
      dispatch({ type: actionTypes.SET_SELECTED_RECIPE, payload: normalizeRecipe(result.data) });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [getAuthHeaders, handleApiResponse]);

  const updateSearchTerm = useCallback((term) => {
    dispatch({ type: actionTypes.SET_SEARCH_TERM, payload: term });
  }, []);

  const closeRecipeDetail = useCallback(() => {
    dispatch({ type: actionTypes.SET_SELECTED_RECIPE, payload: null });
  }, []);

  const addRecipe = useCallback((recipe) => {
    dispatch({ type: actionTypes.ADD_RECIPE, payload: recipe });
  }, []);

  const updateRecipe = useCallback((recipe) => {
    dispatch({ type: actionTypes.UPDATE_RECIPE, payload: recipe });
  }, []);

  const removeRecipe = useCallback((recipeId) => {
    dispatch({ type: actionTypes.REMOVE_RECIPE, payload: recipeId });
  }, []);

  // Listener para sincronizar com ResourceManager via WebSocket
  useEffect(() => {
    // Não conecta WebSocket em ambiente de teste
    if (typeof WebSocket === 'undefined' || process.env.NODE_ENV === 'test') {
      return undefined;
    }

    const socket = new WebSocket(NOTIFICATION_SERVICE_URL);

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'recipe.created' && payload?.payload?._id) {
          addRecipe(payload.payload);
        } else if (payload?.type === 'recipe.updated' && payload?.payload?._id) {
          updateRecipe(payload.payload);
        } else if (payload?.type === 'recipe.deleted' && payload?.payload?._id) {
          removeRecipe(payload.payload._id);
        }
      } catch {
        // Ignore malformed payloads.
      }
    });

    return () => socket.close();
  }, [addRecipe, updateRecipe, removeRecipe]);

  const value = {
    state,
    dispatch,
    searchRecipes,
    getRecipeDetail,
    updateSearchTerm,
    closeRecipeDetail,
    addRecipe,
    updateRecipe,
    removeRecipe,
  };

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export const useRecipes = () => {
  const context = React.useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes deve ser usado dentro de RecipeProvider');
  }
  return context;
};
