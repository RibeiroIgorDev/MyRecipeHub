import { useRecipes } from '../contexts/RecipeContext';
import {
  CardContainer,
  CardImage,
  CardPlaceholder,
  CardContent,
  CardMeta,
} from './RecipeCard.styles';

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

export default function RecipeCard({ recipe }) {
  const { getRecipeDetail } = useRecipes();

  const handleClick = () => {
    getRecipeDetail(recipe.id);
  };

  return (
    <CardContainer onClick={handleClick}>
      <CardImage src={getImage(recipe)}>
        {!getImage(recipe) && <CardPlaceholder>Sem imagem</CardPlaceholder>}
      </CardImage>
      <CardContent>
        <h3>{recipe.name || 'Receita desconhecida'}</h3>
        {recipe.description && <p>{recipe.description}</p>}
        <CardMeta>
          <span>{getSubtitle(recipe)}</span>
          {recipe.prep_time && <span>{recipe.prep_time} min</span>}
        </CardMeta>
      </CardContent>
    </CardContainer>
  );
}
