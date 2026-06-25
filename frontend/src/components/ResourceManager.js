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
} from './ResourceManager.styles';

const RESOURCE_SERVICE_URL = process.env.REACT_APP_RESOURCE_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'ws://localhost:3004';

export default function ResourceManager({ authToken }) {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', theme: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
      if (!response.ok) throw new Error(data.error || 'Falha ao carregar recursos.');
      setResources(data.data || []);
    } catch (err) {
      setError(err.message || 'Falha ao carregar recursos.');
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

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        theme: form.theme.trim(),
      };

      const response = await fetch(`${RESOURCE_SERVICE_URL}/resources${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao salvar recurso.');

      setMessage(editingId ? 'Recurso atualizado com sucesso.' : 'Recurso criado com sucesso.');
      setForm({ title: '', description: '', theme: '' });
      setEditingId(null);
      loadResources();
    } catch (err) {
      setError(err.message || 'Falha ao salvar recurso.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource) => {
    setEditingId(resource.id);
    setForm({
      title: resource.title,
      description: resource.description,
      theme: resource.theme,
    });
    setMessage('');
    setError('');
  };

  const handleDelete = async (resource) => {
    if (!window.confirm(`Excluir o recurso "${resource.title}"?`)) return;
    if (!authToken) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${RESOURCE_SERVICE_URL}/resources/${resource.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao excluir recurso.');

      setMessage('Recurso removido com sucesso.');
      loadResources();
    } catch (err) {
      setError(err.message || 'Falha ao excluir recurso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResourcePanel>
      <ResourceHeader>
        <div>
          <h2>Gerenciar recursos</h2>
          <p>Crie, edite e remova recursos protegidos pelo serviço de autenticação.</p>
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
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ex.: Receita de bolo"
          />
        </ResourceField>

        <ResourceField>
          <label htmlFor="resource-theme">Tema</label>
          <ResourceInput
            id="resource-theme"
            value={form.theme}
            onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value }))}
            placeholder="Ex.: sobremesa"
          />
        </ResourceField>

        <ResourceButton type="submit" disabled={loading || !form.title.trim() || !form.description.trim() || !form.theme.trim()}>
          {editingId ? 'Salvar alteração' : 'Adicionar recurso'}
        </ResourceButton>

        <ResourceField style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="resource-description">Descrição</label>
          <ResourceTextarea
            id="resource-description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Descreva o recurso"
          />
        </ResourceField>
      </ResourceForm>

      {loading && <Notice $variant="success">Carregando recursos...</Notice>}

      <ResourceList>
        {resources.map((resource) => (
          <ResourceItem key={resource.id}>
            <strong>{resource.title}</strong>
            <p>{resource.description}</p>
            <p>Tema: {resource.theme}</p>
            <ResourceMeta>
              <span>#{resource.id}</span>
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
