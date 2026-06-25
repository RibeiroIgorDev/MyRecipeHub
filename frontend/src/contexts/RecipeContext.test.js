import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { RecipeProvider, useRecipes } from './RecipeContext';

function SearchConsumer() {
  const { state, searchRecipes } = useRecipes();

  return (
    <div>
      <button onClick={() => searchRecipes('sopa')}>Search</button>
      <div data-testid="count">{state.recipes.length}</div>
      {state.recipes.map((recipe) => (
        <div key={recipe.id}>{recipe.name}</div>
      ))}
    </div>
  );
}

describe('RecipeContext', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('uses the local resource service for recipe search', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, title: 'Sopa', description: 'Receita de sopa', theme: 'sopas' }],
      }),
    });

    render(
      <RecipeProvider authToken="test-token">
        <SearchConsumer />
      </RecipeProvider>
    );

    await act(async () => {
      screen.getByText('Search').click();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3003/resources?q=sopa',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
    expect(await screen.findByText('Sopa')).toBeInTheDocument();
  });
});
