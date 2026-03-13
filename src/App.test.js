import { render, screen } from '@testing-library/react';

jest.mock('./components/QueryExplorer', () => () => <div>Query Explorer</div>);
jest.mock('./components/main', () => () => <div>Main</div>);

jest.mock('./firebase', () => ({
  signOutUser: jest.fn(),
  signInWithEmail: jest.fn(),
  registerWithEmail: jest.fn(),
  subscribeToAuthChanges: jest.fn((callback) => {
    callback(null);
    return jest.fn();
  }),
}));

const App = require('./App').default;

test('renders email sign-in form', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /вход/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/парола/i)).toBeInTheDocument();
});
