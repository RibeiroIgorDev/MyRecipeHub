import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResourceManager from './ResourceManager';

test('renders the recipe management form with recipe-specific fields', () => {
  render(<ResourceManager authToken={null} />);

  expect(screen.getByText(/gerenciar recursos/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/cozinha/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/ingredientes/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/modo de preparo/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/tema/i)).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('Ex.: 4')).toBeInTheDocument();
});

test('submits nutrition values without braces as an object', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: [] }),
  });

  render(<ResourceManager authToken="token" />);

  fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Bolo' } });
  fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Receita teste' } });
  fireEvent.change(screen.getByLabelText(/nutrição/i), { target: { value: 'calorias: 300\nproteinas: 8' } });

  const form = screen.getByRole('button', { name: /adicionar recurso/i }).closest('form');
  fireEvent.submit(form);

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

  const [, request] = global.fetch.mock.calls[1];
  const payload = JSON.parse(request.body);
  expect(payload.nutrition).toEqual({ calorias: 300, proteinas: 8 });
});
