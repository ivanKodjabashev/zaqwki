import { act, render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';

jest.mock('./components/QueryExplorer', () => {
  const { forwardRef } = require('react');
  return forwardRef(function QueryExplorer() {
    return <div>Query Explorer</div>;
  });
});
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

test('renders email sign-in form', async () => {
  await act(async () => {
    render(<App />);
  });
  expect(screen.getByRole('heading', { name: /вход/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/парола/i)).toBeInTheDocument();
});
