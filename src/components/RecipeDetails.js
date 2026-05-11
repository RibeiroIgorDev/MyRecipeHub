import { useRecipes } from '../contexts/RecipeContext';
import {
  Overlay,
  Panel,
  LoadingPanel,
  LoadingMessage,
  CloseButton,
  Header,
  ImageContainer,
  Summary,
  Tags,
  Body,
  NutritionGrid,
  NutritionItem,
} from './RecipeDetails.styles';
import { CardPlaceholder } from './RecipeCard.styles';

const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(/\n|\r\n/).filter(Boolean);
};

const getImage = (recipe) => {
  return recipe.image || recipe.photo || recipe.thumbnail || recipe.photo_url || '';
};

export default function RecipeDetails() {
  const { state, closeRecipeDetail } = useRecipes();
  const { selectedRecipe, loading } = state;

  if (!selectedRecipe && !loading) return null;

  if (loading && !selectedRecipe) {
    return (
      <Overlay role="dialog" aria-modal="true">
        <LoadingPanel>
          <CloseButton onClick={closeRecipeDetail} aria-label="Fechar detalhes">
            ×
          </CloseButton>
          <LoadingMessage>Carregando receita...</LoadingMessage>
        </LoadingPanel>
      </Overlay>
    );
  }

  if (!selectedRecipe) return null;

  const instructions = normalizeArray(selectedRecipe.instructions);
  const ingredients = Array.isArray(selectedRecipe.ingredients)
    ? selectedRecipe.ingredients
    : normalizeArray(selectedRecipe.ingredients).map((item) => ({ name: item }));
  const nutrition = selectedRecipe.nutrition || selectedRecipe.nutrition_info || selectedRecipe.nutrition_data || {};

  return (
    <Overlay role="dialog" aria-modal="true">
      <Panel>
        <CloseButton onClick={closeRecipeDetail} aria-label="Fechar detalhes">
          ×
        </CloseButton>
        <Header>
          <ImageContainer src={getImage(selectedRecipe)}>
            {!getImage(selectedRecipe) && <CardPlaceholder>Sem imagem</CardPlaceholder>}
          </ImageContainer>
          <Summary>
            <h2>{selectedRecipe.name}</h2>
            {selectedRecipe.description && <p>{selectedRecipe.description}</p>}
            <Tags>
              {selectedRecipe.cuisine && <span>{selectedRecipe.cuisine}</span>}
              {selectedRecipe.diet && <span>{selectedRecipe.diet}</span>}
              {selectedRecipe.meal_type && <span>{selectedRecipe.meal_type}</span>}
              {selectedRecipe.servings && <span>Rende {selectedRecipe.servings}</span>}
              {selectedRecipe.prep_time && <span>Prep {selectedRecipe.prep_time} min</span>}
              {selectedRecipe.cook_time && <span>Cook {selectedRecipe.cook_time} min</span>}
            </Tags>
          </Summary>
        </Header>

        <Body>
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
              <NutritionGrid>
                {Object.entries(nutrition).map(([key, value]) => (
                  <NutritionItem key={key}>
                    <strong>{key.replace(/_/g, ' ')}</strong>
                    <span>{value}</span>
                  </NutritionItem>
                ))}
              </NutritionGrid>
            </section>
          )}
        </Body>
      </Panel>
    </Overlay>
  );
}
