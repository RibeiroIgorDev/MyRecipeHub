import { render, screen } from '@testing-library/react';
import App from './App';

test('shows the authentication screen when no session is available', () => {
  render(<App />);
  expect(screen.getByText(/autenticação/i)).toBeInTheDocument();
});
