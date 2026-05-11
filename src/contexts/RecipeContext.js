import React, { createContext, useReducer, useCallback } from 'react';

export const RecipeContext = createContext();

const API_KEY = process.env.REACT_APP_RECIPE_API_KEY;
const BASE_URL = 'https://recipeapi.io/api/v1';

const initialState = {
  recipes: [],
  selectedRecipe: null,
  loading: false,
  error: '',
  searchTerm: 'pasta',
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
    default:
      return state;
  }
}

export function RecipeProvider({ children }) {
  const [state, dispatch] = useReducer(recipeReducer, initialState);

  const getAuthHeaders = useCallback(() => {
    if (!API_KEY) {
      throw new Error('Chave de API ausente. Configure REACT_APP_RECIPE_API_KEY em .env.local');
    }
    return {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const handleApiResponse = useCallback(async (response) => {
    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || 'Falha ao buscar dados da API.';
      throw new Error(message);
    }
    return data;
  }, []);

  const searchRecipes = useCallback(async (query, pageNumber = 1) => {
    // Validação de campo obrigatório
    if (!query || !query.trim()) {
      dispatch({ type: actionTypes.SET_VALIDATION_ERROR, payload: 'Campo de busca é obrigatório.' });
      return;
    }

    dispatch({ type: actionTypes.RESET_VALIDATION_ERROR });
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    dispatch({ type: actionTypes.SET_ERROR, payload: '' });

    try {
      const params = new URLSearchParams({
        search: query.trim(),
        page: String(pageNumber),
        per_page: '12',
      });

      const response = await fetch(`${BASE_URL}/recipes?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await handleApiResponse(response);
      dispatch({ type: actionTypes.SET_RECIPES, payload: result.data || [] });
      dispatch({
        type: actionTypes.SET_PAGINATION,
        payload: {
          page: result.meta?.current_page || pageNumber,
          lastPage: result.meta?.last_page || 1,
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
      const response = await fetch(`${BASE_URL}/recipes/${recipeId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await handleApiResponse(response);
      dispatch({ type: actionTypes.SET_SELECTED_RECIPE, payload: result.data });
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

  const value = {
    state,
    dispatch,
    searchRecipes,
    getRecipeDetail,
    updateSearchTerm,
    closeRecipeDetail,
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
