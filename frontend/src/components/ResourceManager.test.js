import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResourceManager from './ResourceManager';

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders the recipe management form with recipe-specific fields', () => {
  render(<ResourceManager authToken={null} />);

  expect(screen.getByText(/gerenciar receitas/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/cozinha/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/ingredientes/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/modo de preparo/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/buscar itens/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/tema/i)).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('Ex.: 4')).toBeInTheDocument();
});

test('filters listed recipes by search term in manager', async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      data: [
        {
          _id: '1',
          title: 'Frango assado',
          description: 'Receita com ervas',
          cuisine: 'brasileira',
          ingredients: ['frango', 'alho'],
          instructions: ['assar'],
        },
        {
          _id: '2',
          title: 'Bolo de cenoura',
          description: 'Cobertura de chocolate',
          cuisine: 'brasileira',
          ingredients: ['cenoura', 'farinha'],
          instructions: ['misturar'],
        },
      ],
    }),
  });

  render(<ResourceManager authToken="token" />);

  await waitFor(() => expect(screen.getByText('Frango assado')).toBeInTheDocument());
  expect(screen.getByText('Bolo de cenoura')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/buscar itens/i), { target: { value: 'frango' } });

  expect(screen.getByText('Frango assado')).toBeInTheDocument();
  expect(screen.queryByText('Bolo de cenoura')).not.toBeInTheDocument();
  expect(screen.getByText(/exibindo 1 de 2 receitas/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /limpar busca/i }));
  expect(screen.getByText(/exibindo 2 de 2 receitas/i)).toBeInTheDocument();
  expect(screen.getByText('Bolo de cenoura')).toBeInTheDocument();
});
