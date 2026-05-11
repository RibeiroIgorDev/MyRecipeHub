const BASE_URL = 'https://recipeapi.io/api/v1';
const API_KEY = process.env.REACT_APP_RECIPE_API_KEY;

const getAuthHeaders = () => {
  if (!API_KEY) {
    throw new Error('Missing RecipeAPI key. Set REACT_APP_RECIPE_API_KEY in .env.local');
  }

  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || 'Unable to fetch recipe data.';
    throw new Error(message);
  }
  return data;
};

export async function searchRecipes(query, page = 1, perPage = 12) {
  const params = new URLSearchParams({
    search: query,
    page: String(page),
    per_page: String(perPage),
  });
  const response = await fetch(`${BASE_URL}/recipes?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getRecipeDetail(id) {
  const response = await fetch(`${BASE_URL}/recipes/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getRandomRecipe() {
  const response = await fetch(`${BASE_URL}/recipes/random`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}
