import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Title',
    message: 'Test message',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('renders dialog when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders default button labels', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when close button (X) is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    
    // The close button has an X icon, find the button by its role
    const closeButtons = screen.getAllByRole('button');
    // First button is the close button (X)
    fireEvent.click(closeButtons[0]);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    
    // Find backdrop by its class
    const backdrop = document.querySelector('.bg-black\\/60');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders warning text when provided', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        warningText="This action cannot be undone!"
      />
    );
    expect(screen.getByText('This action cannot be undone!')).toBeInTheDocument();
  });

  it('renders "Don\'t ask again" checkbox when showDontAskAgain is true', () => {
    render(<ConfirmDialog {...defaultProps} showDontAskAgain />);
    expect(screen.getByText("Don't ask me again")).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('does not render checkbox when showDontAskAgain is false', () => {
    render(<ConfirmDialog {...defaultProps} showDontAskAgain={false} />);
    expect(screen.queryByText("Don't ask me again")).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('passes dontAskAgain state to onConfirm when checkbox is checked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} showDontAskAgain />
    );
    
    // Check the checkbox
    fireEvent.click(screen.getByRole('checkbox'));
    // Confirm
    fireEvent.click(screen.getByText('Confirm'));
    
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it('passes false to onConfirm when checkbox is unchecked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} showDontAskAgain />
    );
    
    // Confirm without checking checkbox
    fireEvent.click(screen.getByText('Confirm'));
    
    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it('passes undefined to onConfirm when showDontAskAgain is false', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        {...defaultProps}
        onConfirm={onConfirm}
        showDontAskAgain={false}
      />
    );
    
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it('resets checkbox state when dialog reopens', () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} showDontAskAgain />
    );
    
    // Check the checkbox
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    
    // Close dialog
    rerender(
      <ConfirmDialog
        {...defaultProps}
        isOpen={false}
        onConfirm={onConfirm}
        showDontAskAgain
      />
    );
    
    // Reopen dialog
    rerender(
      <ConfirmDialog
        {...defaultProps}
        isOpen={true}
        onConfirm={onConfirm}
        showDontAskAgain
      />
    );
    
    // Checkbox should be unchecked
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  describe('variants', () => {
    it('applies danger variant styles by default', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton.className).toContain('bg-red-500');
    });

    it('applies warning variant styles', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton.className).toContain('bg-amber-500');
    });

    it('applies info variant styles', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton.className).toContain('bg-blue-500');
    });
  });
});
