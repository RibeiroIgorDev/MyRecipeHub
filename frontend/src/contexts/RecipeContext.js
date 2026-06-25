import React, { createContext, useReducer, useCallback } from 'react';

export const RecipeContext = createContext();

const RESOURCE_SERVICE_URL = process.env.REACT_APP_RESOURCE_SERVICE_URL || 'http://localhost:3003';

const initialState = {
  recipes: [],
  selectedRecipe: null,
  loading: false,
  error: '',
  searchTerm: 'portuguese',
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
