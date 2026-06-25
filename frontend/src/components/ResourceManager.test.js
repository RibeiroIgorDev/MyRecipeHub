import { render, screen } from '@testing-library/react';
import ResourceManager from './ResourceManager';

test('renders the resource management section', () => {
  render(<ResourceManager authToken={null} />);
  expect(screen.getByText(/gerenciar recursos/i)).toBeInTheDocument();
});
