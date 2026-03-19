import { render, screen } from '@testing-library/react';
import App from './App';

test('viser overskrift', () => {
  render(<App />);
  const overskrift = screen.getByText(/React \+ Express App/i);
  expect(overskrift).toBeInTheDocument();
});