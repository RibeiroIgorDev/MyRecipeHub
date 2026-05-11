import React from 'react';
import './RecipeCard.css';

const getImage = (recipe) => {
  return recipe.image || recipe.photo || recipe.thumbnail || recipe.photo_url || '';
};

const getSubtitle = (recipe) => {
  const tags = [];
  if (recipe.cuisine) tags.push(recipe.cuisine);
  if (recipe.diet) tags.push(recipe.diet);
  if (recipe.meal_type) tags.push(recipe.meal_type);
  return tags.join(' • ');
};

export default function RecipeCard({ recipe, onSelect }) {
  return (
    <article className="recipe-card" onClick={() => onSelect(recipe)}>
      <div className="recipe-card-image" style={{ backgroundImage: `url(${getImage(recipe)})` }}>
        {!getImage(recipe) && <div className="recipe-card-placeholder">Sem imagem</div>}
      </div>
      <div className="recipe-card-content">
        <h3>{recipe.name || 'Receita desconhecida'}</h3>
        {recipe.description && <p>{recipe.description}</p>}
        <div className="recipe-card-meta">
          <span>{getSubtitle(recipe)}</span>
          {recipe.prep_time && <span>{recipe.prep_time} min</span>}
        </div>
      </div>
    </article>
  );
}
