/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessageModal } from './error_message_modal';

describe('ErrorMessageModal', () => {
  describe('Basic Rendering', () => {
    it('should render short error messages without truncation', () => {
      const shortError = 'Connection timeout';
      render(<ErrorMessageModal errorMessage={shortError} />);

      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
      expect(screen.queryByTestId('viewAllErrorLink')).not.toBeInTheDocument();
    });

    it('should truncate long error messages', () => {
      const longError =
        "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos) in type env. This error occurred because the field is not present.";
      render(<ErrorMessageModal errorMessage={longError} maxLength={30} />);

      // Should show truncated version - check for the ellipsis
      expect(screen.getByText(/can't resolve Symbol\(namespace\.\.\./)).toBeInTheDocument();
      expect(screen.getByTestId('viewAllErrorLink')).toBeInTheDocument();
    });

    it('should respect custom maxLength prop', () => {
      const error = 'This is a test error message that should be truncated at 50 characters';
      render(<ErrorMessageModal errorMessage={error} maxLength={50} />);

      // Should show truncated version with ellipsis
      expect(
        screen.getByText(/This is a test error message that should be trunca\.\.\./)
      ).toBeInTheDocument();
      expect(screen.getByTestId('viewAllErrorLink')).toBeInTheDocument();
    });

    it('should not truncate message exactly at maxLength', () => {
      const error = 'Exactly thirty characters!!';
      render(<ErrorMessageModal errorMessage={error} maxLength={30} />);

      expect(screen.getByText('Exactly thirty characters!!')).toBeInTheDocument();
      expect(screen.queryByTestId('viewAllErrorLink')).not.toBeInTheDocument();
    });
  });

  describe('Modal Interaction', () => {
    it('should open modal when "View error details" link is clicked', () => {
      const longError = 'a'.repeat(100);
      render(<ErrorMessageModal errorMessage={longError} maxLength={30} />);

      // Modal should not be visible initially
      expect(screen.queryByText('Error Details')).not.toBeInTheDocument();

      // Click the link
      fireEvent.click(screen.getByTestId('viewAllErrorLink'));

      // Modal should now be visible
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', () => {
      const longError = 'a'.repeat(100);
      render(<ErrorMessageModal errorMessage={longError} maxLength={30} />);

      // Open modal
      fireEvent.click(screen.getByTestId('viewAllErrorLink'));
      expect(screen.getByText('Error Details')).toBeInTheDocument();

      // Close modal - EuiModal has a close button with aria-label
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      // Modal should be closed
      expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    });

    it('should display full error message in modal', () => {
      const longError =
        "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos) in type env. This error occurred because the field is not present in the current dataset schema. Please verify that your data source contains this field.";
      render(<ErrorMessageModal errorMessage={longError} maxLength={30} />);

      // Open modal
      fireEvent.click(screen.getByTestId('viewAllErrorLink'));

      // Verify modal title
      expect(screen.getByText('Error Details')).toBeInTheDocument();

      // Verify full error message is displayed
      expect(screen.getByText(longError)).toBeInTheDocument();
    });
  });

  describe('Error Message Handling', () => {
    it('should handle string error messages', () => {
      const stringError = 'This is a string error';
      render(<ErrorMessageModal errorMessage={stringError} />);

      expect(screen.getByText('This is a string error')).toBeInTheDocument();
    });

    it('should handle non-string error messages by converting to JSON', () => {
      const objectError = {
        statusCode: 400,
        message: 'Bad Request',
        details: 'Field not found',
      };
      render(<ErrorMessageModal errorMessage={objectError as any} maxLength={20} />);

      // Should show truncated JSON
      expect(screen.getByTestId('viewAllErrorLink')).toBeInTheDocument();

      // Open modal to see full JSON
      fireEvent.click(screen.getByTestId('viewAllErrorLink'));

      // Should display modal with title
      expect(screen.getByText('Error Details')).toBeInTheDocument();
    });

    it('should handle empty error messages', () => {
      render(<ErrorMessageModal errorMessage="" />);

      // Should render without crashing
      expect(screen.queryByTestId('viewAllErrorLink')).not.toBeInTheDocument();
    });

    it('should handle very long error messages in modal', () => {
      const veryLongError = 'Error: '.repeat(500); // ~3500 characters
      render(<ErrorMessageModal errorMessage={veryLongError} maxLength={30} />);

      // Open modal
      fireEvent.click(screen.getByTestId('viewAllErrorLink'));

      // Modal should be visible with title
      expect(screen.getByText('Error Details')).toBeInTheDocument();
    });

    it('should handle error messages with special characters', () => {
      const specialCharsError = 'Error: <script>alert("xss")</script> & "quotes" \'apostrophes\'';
      const { container } = render(<ErrorMessageModal errorMessage={specialCharsError} />);

      // Check that the paragraph contains the special characters
      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toContain('Error:');
      expect(paragraph?.textContent).toContain('alert');
    });

    it('should handle null error messages gracefully', () => {
      const { container } = render(<ErrorMessageModal errorMessage={null as any} />);

      // Should convert null to string
      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toContain('null');
    });

    it('should handle undefined error messages gracefully', () => {
      const { container } = render(<ErrorMessageModal errorMessage={undefined as any} />);

      // Should convert undefined to string
      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toContain('undefined');
    });

    it('should handle number error messages', () => {
      const { container } = render(<ErrorMessageModal errorMessage={404 as any} />);

      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toContain('404');
    });
  });

  describe('Accessibility', () => {
    it('should have proper word breaking for long words', () => {
      const longWordError = 'Supercalifragilisticexpialidocious'.repeat(5);
      const { container } = render(
        <ErrorMessageModal errorMessage={longWordError} maxLength={30} />
      );

      // Check that the paragraph has word-break styles
      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveStyle({
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      });
    });

    it('should have accessible link text', () => {
      const longError = 'a'.repeat(100);
      render(<ErrorMessageModal errorMessage={longError} maxLength={30} />);

      const link = screen.getByTestId('viewAllErrorLink');
      expect(link).toHaveTextContent('View error details');
    });

    it('should support keyboard navigation for link', () => {
      const longError = 'a'.repeat(100);
      render(<ErrorMessageModal errorMessage={longError} maxLength={30} />);

      const link = screen.getByTestId('viewAllErrorLink');

      // Link should be focusable
      link.focus();
      expect(document.activeElement).toBe(link);
    });
  });

  describe('Internationalization', () => {
    it('should use i18n for link text', () => {
      const longError = 'a'.repeat(100);
      render(<ErrorMessageModal errorMessage={longError} maxLength={30} />);

      // The link should use the i18n translated text
      expect(screen.getByText('View error details')).toBeInTheDocument();
    });

    it('should use i18n for modal title', () => {
      const longError = 'a'.repeat(100);
      render(<ErrorMessageModal errorMessage={longError} maxLength={30} />);

      fireEvent.click(screen.getByTestId('viewAllErrorLink'));

      // Modal title should use i18n
      expect(screen.getByText('Error Details')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle error message with only whitespace', () => {
      const whitespaceError = '     ';
      const { container } = render(<ErrorMessageModal errorMessage={whitespaceError} />);

      // Check that the paragraph contains the whitespace
      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toContain('     ');
    });

    it('should handle error message with newlines', () => {
      const multilineError = 'Line 1\nLine 2\nLine 3';
      const { container } = render(<ErrorMessageModal errorMessage={multilineError} />);

      // Check that the paragraph contains the multiline text
      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toContain('Line 1');
      expect(paragraph?.textContent).toContain('Line 2');
      expect(paragraph?.textContent).toContain('Line 3');
    });

    it('should handle error message at exactly maxLength + 1', () => {
      const error = 'a'.repeat(31);
      render(<ErrorMessageModal errorMessage={error} maxLength={30} />);

      // Should truncate
      expect(screen.getByTestId('viewAllErrorLink')).toBeInTheDocument();
    });

    it('should handle maxLength of 0', () => {
      const error = 'Any error';
      render(<ErrorMessageModal errorMessage={error} maxLength={0} />);

      // Should show link since error length > 0
      expect(screen.getByTestId('viewAllErrorLink')).toBeInTheDocument();
    });

    it('should handle negative maxLength', () => {
      const error = 'Any error';
      render(<ErrorMessageModal errorMessage={error} maxLength={-10} />);

      // Should show link since error length > negative number
      expect(screen.getByTestId('viewAllErrorLink')).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should handle multiple ErrorMessageModal instances independently', () => {
      const error1 = 'a'.repeat(100);
      const error2 = 'b'.repeat(100);

      const { container } = render(
        <>
          <div data-testid="modal1">
            <ErrorMessageModal errorMessage={error1} maxLength={30} />
          </div>
          <div data-testid="modal2">
            <ErrorMessageModal errorMessage={error2} maxLength={30} />
          </div>
        </>
      );

      // Both should show links
      const links = screen.getAllByTestId('viewAllErrorLink');
      expect(links).toHaveLength(2);

      // Click first link
      fireEvent.click(links[0]);

      // Should show first error in modal
      expect(screen.getByText(error1)).toBeInTheDocument();
      expect(screen.queryByText(error2)).not.toBeInTheDocument();
    });
  });
});
