/* eslint-env jest */
import { render, screen } from '@testing-library/react';
import PassTable from '../PassTable';

const samplePrediction = {
  satellite: { name: 'Cartosat-2F' },
  prediction: {
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 600000).toISOString(),
    durationMinutes: 10,
    maxElevation: 65.5,
    dayNight: 'Night',
    visibilityScore: 'Good',
  },
  weather: {
    visibilityScore: 'Good',
    source: 'Test',
    raw: {
      weather: [{ description: 'clear sky' }],
      clouds: { all: 5 },
      visibility: 9000,
    },
  },
};

describe('PassTable', () => {
  it('shows a hint when there is no prediction', () => {
    render(<PassTable data={null} />);
    expect(
      screen.getByText(/awaiting prediction/i)
    ).toBeInTheDocument();
  });

  it('renders prediction details', () => {
    render(<PassTable data={samplePrediction} />);
    expect(screen.getByText(/Cartosat-2F/)).toBeInTheDocument();
    expect(screen.getByText(/Visibility Score/)).toBeInTheDocument();
    expect(screen.getByText(/Good/)).toBeInTheDocument();
  });
});

