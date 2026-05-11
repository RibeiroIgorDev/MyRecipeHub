import React from 'react';
import './RecipeDetails.css';

const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(/\n|\r\n/).filter(Boolean);
};

const getImage = (recipe) => {
  return recipe.image || recipe.photo || recipe.thumbnail || recipe.photo_url || '';
};

export default function RecipeDetails({ recipe, loading = false, onClose }) {
  if (!recipe && !loading) return null;

  if (loading && !recipe) {
    return (
      <div className="recipe-details-overlay" role="dialog" aria-modal="true">
        <div className="recipe-details-panel loading-panel">
          <button className="recipe-details-close" onClick={onClose} aria-label="Fechar detalhes">
            ×
          </button>
          <div className="loading-message">Carregando receita...</div>
        </div>
      </div>
    );
  }

  const instructions = normalizeArray(recipe.instructions);
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : normalizeArray(recipe.ingredients).map((item) => ({ name: item }));
  const nutrition = recipe.nutrition || recipe.nutrition_info || recipe.nutrition_data || {};

  return (
    <div className="recipe-details-overlay" role="dialog" aria-modal="true">
      <div className="recipe-details-panel">
        <button className="recipe-details-close" onClick={onClose} aria-label="Fechar detalhes">
          ×
        </button>
        <div className="recipe-details-header">
          <div className="recipe-details-image" style={{ backgroundImage: `url(${getImage(recipe)})` }}>
            {!getImage(recipe) && <div className="recipe-card-placeholder">Sem imagem</div>}
          </div>
          <div className="recipe-details-summary">
            <h2>{recipe.name}</h2>
            {recipe.description && <p>{recipe.description}</p>}
            <div className="recipe-details-tags">
              {recipe.cuisine && <span>{recipe.cuisine}</span>}
              {recipe.diet && <span>{recipe.diet}</span>}
              {recipe.meal_type && <span>{recipe.meal_type}</span>}
            </div>
            <div className="recipe-details-info">
              {recipe.servings && <span>Rende {recipe.servings}</span>}
              {recipe.prep_time && <span>Prep {recipe.prep_time} min</span>}
              {recipe.cook_time && <span>Cook {recipe.cook_time} min</span>}
            </div>
          </div>
        </div>

        <div className="recipe-details-body">
          <section>
            <h3>Ingredientes</h3>
            {ingredients.length > 0 ? (
              <ul>
                {ingredients.map((item, index) => (
                  <li key={`${item.name || item}-${index}`}>{item.name || item}</li>
                ))}
              </ul>
            ) : (
              <p>Sem lista de ingredientes disponível.</p>
            )}
          </section>

          <section>
            <h3>Instruções</h3>
            {instructions.length > 0 ? (
              <ol>
                {instructions.map((step, index) => (
                  <li key={`${step}-${index}`}>{step}</li>
                ))}
              </ol>
            ) : (
              <p>Sem instruções disponíveis.</p>
            )}
          </section>

          {Object.keys(nutrition).length > 0 && (
            <section>
              <h3>Informações Nutricionais</h3>
              <div className="nutrition-grid">
                {Object.entries(nutrition).map(([key, value]) => (
                  <div key={key} className="nutrition-item">
                    <strong>{key.replace(/_/g, ' ')}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
