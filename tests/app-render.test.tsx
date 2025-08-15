import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

class WorkerMock {
  constructor(_url: string) {}
  postMessage() {}
  terminate() {}
}

// @ts-ignore
global.Worker = WorkerMock;

describe('App component', () => {
  it('renders Sidebar and MapComponent', () => {
    render(<App />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByLabelText('Analyze Scenario')).toBeInTheDocument();
  });
});
