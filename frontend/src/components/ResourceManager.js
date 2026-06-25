import { useCallback, useEffect, useState } from 'react';
import {
  ResourcePanel,
  ResourceHeader,
  ResourceForm,
  ResourceField,
  ResourceInput,
  ResourceTextarea,
  ResourceButton,
  ResourceList,
  ResourceItem,
  ResourceMeta,
  ResourceActions,
  ActionButton,
  Notice,
  FieldError,
} from './ResourceManager.styles';

const RESOURCE_SERVICE_URL = process.env.REACT_APP_RESOURCE_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'ws://localhost:3004';

const createInitialFormState = () => ({
  title: '',
  description: '',
  cuisine: '',
  diet: '',
  meal_type: '',
  prep_time: '',
  cook_time: '',
  servings: '',
  image: '',
  ingredients: '',
  instructions: '',
  nutrition: '',
});

const serializeList = (value) => {
  if (Array.isArray(value)) return value.join('\n');
  if (typeof value === 'string') return value;
  return '';
};

const serializeNutrition = (value) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, entryValue]) => `${key}: ${entryValue}`)
      .join('\n');
  }
  return '';
};

const parseNutritionValue = (value) => {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;
  return trimmed;
};

const parseNutritionInput = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // Fall through to plain-text parsing.
    }

    return trimmed
      .split(/\n|;|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .reduce((accumulator, entry) => {
        const separatorIndex = entry.search(/[:=]/);
        if (separatorIndex === -1) return accumulator;

        const key = entry.slice(0, separatorIndex).trim();
        const rawValue = entry.slice(separatorIndex + 1).trim();
        if (!key || !rawValue) return accumulator;

        accumulator[key] = parseNutritionValue(rawValue);
        return accumulator;
      }, {});
  }
  return {};
};

const parseList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(/\n|\r\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function ResourceManager({ authToken }) {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(createInitialFormState);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleNumericChange = (field) => (event) => {
    const value = event.target.value.replace(/[^0-9]/g, '');
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    const prepTime = Number(form.prep_time);
    const cookTime = Number(form.cook_time);
    const servings = Number(form.servings);

    if (!form.prep_time.trim()) errors.prep_time = 'Informe o tempo de preparo.';
    else if (prepTime <= 0) errors.prep_time = 'Tempo de preparo deve ser maior que zero.';

    if (!form.cook_time.trim()) errors.cook_time = 'Informe o tempo de cozimento.';
    else if (cookTime <= 0) errors.cook_time = 'Tempo de cozimento deve ser maior que zero.';

    if (!form.servings.trim()) errors.servings = 'Informe o rendimento.';
    else if (servings <= 0) errors.servings = 'Rendimento deve ser maior que zero.';

    if (form.image.trim() && !/^https?:\/\/.+/.test(form.image.trim()))
      errors.image = 'URL da imagem deve começar com http:// ou https://';

    if (form.title.trim().length < 3) errors.title = 'Título deve ter ao menos 3 caracteres.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  });

  const loadResources = useCallback(async () => {
    if (!authToken) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${RESOURCE_SERVICE_URL}/resources`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao carregar receitas.');
      setResources(data.data || []);
    } catch (err) {
      setError(err.message || 'Falha ao carregar receitas.');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadResources();
  }, [authToken, loadResources]);

  useEffect(() => {
    if (!authToken) return undefined;

    const socket = new WebSocket(NOTIFICATION_SERVICE_URL);

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type) {
          setMessage(`Atualização recebida: ${payload.type}`);
          loadResources();
        }
      } catch {
        // Ignore malformed payloads.
      }
    });

    return () => socket.close();
  }, [authToken, loadResources]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!authToken) return;
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        cuisine: form.cuisine.trim(),
        diet: form.diet.trim(),
        meal_type: form.meal_type.trim(),
        prep_time: form.prep_time.trim(),
        cook_time: form.cook_time.trim(),
        servings: form.servings.trim(),
        image: form.image.trim(),
        ingredients: parseList(form.ingredients),
        instructions: parseList(form.instructions),
        nutrition: parseNutritionInput(form.nutrition),
      };

      const response = await fetch(`${RESOURCE_SERVICE_URL}/resources${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao salvar receita.');

      setMessage(editingId ? 'Receita atualizada com sucesso.' : 'Receita criada com sucesso.');
      setForm(createInitialFormState());
      setEditingId(null);
      setFieldErrors({});
      loadResources();
    } catch (err) {
      setError(err.message || 'Falha ao salvar receita.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource) => {
    setEditingId(resource._id);
    setForm({
      title: resource.title || '',
      description: resource.description || '',
      cuisine: resource.cuisine || '',
      diet: resource.diet || '',
      meal_type: resource.meal_type || '',
      prep_time: resource.prep_time || '',
      cook_time: resource.cook_time || '',
      servings: resource.servings || '',
      image: resource.image || '',
      ingredients: serializeList(resource.ingredients),
      instructions: serializeList(resource.instructions),
      nutrition: serializeNutrition(resource.nutrition),
    });
    setMessage('');
    setError('');
    setFieldErrors({});
  };

  const handleDelete = async (resource) => {
    if (!window.confirm(`Excluir a receita "${resource.title}"?`)) return;
    if (!authToken) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${RESOURCE_SERVICE_URL}/resources/${resource._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao excluir receita.');

      setMessage('Receita removida com sucesso.');
      loadResources();
    } catch (err) {
      setError(err.message || 'Falha ao excluir receita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResourcePanel>
      <ResourceHeader>
        <div>
          <h2>Gerenciar receitas</h2>
          <p>Crie, edite e remova receitas.</p>
        </div>
      </ResourceHeader>

      {error && <Notice $variant="error">{error}</Notice>}
      {message && <Notice $variant="success">{message}</Notice>}

      <ResourceForm onSubmit={handleSubmit}>
        <ResourceField>
          <label htmlFor="resource-title">Título</label>
          <ResourceInput
            id="resource-title"
            value={form.title}
            onChange={(event) => {
              setForm((current) => ({ ...current, title: event.target.value }));
              setFieldErrors((current) => ({ ...current, title: '' }));
            }}
            placeholder="Ex.: Bolo de cenoura"
          />
          {fieldErrors.title && <FieldError>{fieldErrors.title}</FieldError>}
        </ResourceField>

        <ResourceField>
          <label htmlFor="resource-cuisine">Cozinha</label>
          <ResourceInput
            id="resource-cuisine"
            value={form.cuisine}
            onChange={(event) => setForm((current) => ({ ...current, cuisine: event.target.value }))}
            placeholder="Ex.: brasileira"
          />
        </ResourceField>

        <ResourceField>
          <label htmlFor="resource-diet">Dieta</label>
          <ResourceInput
            id="resource-diet"
            value={form.diet}
            onChange={(event) => setForm((current) => ({ ...current, diet: event.target.value }))}
            placeholder="Ex.: vegano"
          />
        </ResourceField>

        <ResourceField>
          <label htmlFor="resource-meal-type">Tipo de refeição</label>
          <ResourceInput
            id="resource-meal-type"
            value={form.meal_type}
            onChange={(event) => setForm((current) => ({ ...current, meal_type: event.target.value }))}
            placeholder="Ex.: sobremesa"
          />
        </ResourceField>

        <ResourceField>
          <label htmlFor="resource-prep-time">Tempo de preparo (min)</label>
          <ResourceInput
            id="resource-prep-time"
            inputMode="numeric"
            value={form.prep_time}
            onChange={handleNumericChange('prep_time')}
            placeholder="Ex.: 25"
          />
          {fieldErrors.prep_time && <FieldError>{fieldErrors.prep_time}</FieldError>}
        </ResourceField>

        <ResourceField>
          <label htmlFor="resource-cook-time">Tempo de cozimento (min)</label>
          <ResourceInput
            id="resource-cook-time"
            inputMode="numeric"
            value={form.cook_time}
            onChange={handleNumericChange('cook_time')}
            placeholder="Ex.: 40"
          />
          {fieldErrors.cook_time && <FieldError>{fieldErrors.cook_time}</FieldError>}
        </ResourceField>

        <ResourceField>
          <label htmlFor="resource-servings">Rendimento (porções)</label>
          <ResourceInput
            id="resource-servings"
            inputMode="numeric"
            value={form.servings}
            onChange={handleNumericChange('servings')}
            placeholder="Ex.: 4"
          />
          {fieldErrors.servings && <FieldError>{fieldErrors.servings}</FieldError>}
        </ResourceField>

        <ResourceField>
          <label htmlFor="resource-image">Imagem</label>
          <ResourceInput
            id="resource-image"
            value={form.image}
            onChange={(event) => {
              setForm((current) => ({ ...current, image: event.target.value }));
              setFieldErrors((current) => ({ ...current, image: '' }));
            }}
            placeholder="Ex.: https://example.com/imagem.jpg"
          />
          {fieldErrors.image && <FieldError>{fieldErrors.image}</FieldError>}
        </ResourceField>

        <ResourceField style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="resource-description">Descrição</label>
          <ResourceTextarea
            id="resource-description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Descreva a receita"
          />
        </ResourceField>

        <ResourceField style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="resource-ingredients">Ingredientes</label>
          <ResourceTextarea
            id="resource-ingredients"
            value={form.ingredients}
            onChange={(event) => setForm((current) => ({ ...current, ingredients: event.target.value }))}
            placeholder="Digite um ingrediente por linha"
          />
        </ResourceField>

        <ResourceField style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="resource-instructions">Modo de preparo</label>
          <ResourceTextarea
            id="resource-instructions"
            value={form.instructions}
            onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))}
            placeholder="Digite um passo por linha"
          />
        </ResourceField>

        <ResourceField style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="resource-nutrition">Nutrição</label>
          <ResourceTextarea
            id="resource-nutrition"
            value={form.nutrition}
            onChange={(event) => setForm((current) => ({ ...current, nutrition: event.target.value }))}
            placeholder='Digite um item nutricional por linha (Ex.: Calorias: 300)'
          />
        </ResourceField>

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
          <ResourceButton
            type="submit"
            disabled={
              loading
              || !form.title.trim()
              || !form.description.trim()
              || !form.cuisine.trim()
              || !form.diet.trim()
              || !form.meal_type.trim()
              || !form.prep_time.trim()
              || !form.cook_time.trim()
              || !form.servings.trim()
              || !form.image.trim()
              || !form.ingredients.trim()
              || !form.instructions.trim()
            }
          >
            {editingId ? 'Salvar alterações' : 'Adicionar receita'}
          </ResourceButton>
          {editingId && (
            <ResourceButton
              type="button"
              onClick={() => { setEditingId(null); setForm(createInitialFormState()); setError(''); setMessage(''); setFieldErrors({}); }}
              style={{ background: '#888' }}
            >
              Cancelar
            </ResourceButton>
          )}
        </div>
      </ResourceForm>

      {loading && <Notice $variant="success">Carregando receitas...</Notice>}

      <ResourceList>
        {resources.map((resource) => (
          <ResourceItem key={resource._id}>
            <strong>{resource.title}</strong>
            <p>{resource.description}</p>
            {resource.cuisine && <p>Cozinha: {resource.cuisine}</p>}
            {resource.diet && <p>Dieta: {resource.diet}</p>}
            {resource.meal_type && <p>Tipo: {resource.meal_type}</p>}
            {resource.prep_time && <p>Preparo: {resource.prep_time} min</p>}
            {resource.cook_time && <p>Cozimento: {resource.cook_time} min</p>}
            {resource.servings && <p>Rendimento: {resource.servings}</p>}
            {resource.image && <p>Imagem: <a href={resource.image} target="_blank" rel="noopener noreferrer">{resource.image}</a></p>}
            {resource.ingredients?.length > 0 && <p>Ingredientes: {resource.ingredients.join(', ')}</p>}
            {resource.instructions?.length > 0 && <p>Modo de preparo: {resource.instructions.join(' → ')}</p>}
            {resource.nutrition && Object.keys(resource.nutrition).length > 0 && (
              <p>Nutrição: {Object.entries(resource.nutrition).map(([key, value]) => `${key}: ${value}`).join(', ')}</p>
            )}
            <ResourceMeta>
              <span>#{resource._id}</span>
              <ResourceActions>
                <ActionButton type="button" onClick={() => handleEdit(resource)}>
                  Editar
                </ActionButton>
                <ActionButton type="button" onClick={() => handleDelete(resource)}>
                  Excluir
                </ActionButton>
              </ResourceActions>
            </ResourceMeta>
          </ResourceItem>
        ))}
      </ResourceList>
    </ResourcePanel>
  );
}
