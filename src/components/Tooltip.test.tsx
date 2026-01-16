import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider, tooltipProps } from './Tooltip';

describe('Tooltip', () => {
  describe('TooltipProvider', () => {
    it('renders without crashing', () => {
      render(<TooltipProvider />);
      // The tooltip should be rendered but not visible initially
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('tooltipProps', () => {
    it('returns correct data attributes for content', () => {
      const props = tooltipProps('Test tooltip');
      
      expect(props['data-tooltip-id']).toBe('global-tooltip');
      expect(props['data-tooltip-content']).toBe('Test tooltip');
      expect(props['data-tooltip-place']).toBeUndefined();
    });

    it('includes place attribute when specified', () => {
      const props = tooltipProps('Test tooltip', 'bottom');
      
      expect(props['data-tooltip-id']).toBe('global-tooltip');
      expect(props['data-tooltip-content']).toBe('Test tooltip');
      expect(props['data-tooltip-place']).toBe('bottom');
    });

    it('supports all placement options', () => {
      const placements: Array<'top' | 'bottom' | 'left' | 'right'> = [
        'top',
        'bottom',
        'left',
        'right',
      ];
      
      placements.forEach((place) => {
        const props = tooltipProps('Test', place);
        expect(props['data-tooltip-place']).toBe(place);
      });
    });

    it('can be spread onto an element', () => {
      const TestComponent = () => (
        <button {...tooltipProps('Click me', 'top')}>Button</button>
      );
      
      render(<TestComponent />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-tooltip-id', 'global-tooltip');
      expect(button).toHaveAttribute('data-tooltip-content', 'Click me');
      expect(button).toHaveAttribute('data-tooltip-place', 'top');
    });
  });
});
