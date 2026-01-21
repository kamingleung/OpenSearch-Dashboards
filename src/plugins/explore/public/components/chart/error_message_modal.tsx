/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiCodeBlock,
  EuiLink,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface ErrorMessageModalProps {
  errorMessage: string;
  maxLength?: number;
}

export const ErrorMessageModal: React.FC<ErrorMessageModalProps> = ({
  errorMessage,
  maxLength = 30,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Ensure error message is a string
  const errorString =
    typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage, null, 2);

  const shouldTruncate = errorString.length > maxLength;
  const displayMessage = shouldTruncate ? `${errorString.substring(0, maxLength)}...` : errorString;

  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  return (
    <>
      <p style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {displayMessage}
        {shouldTruncate && (
          <>
            {' '}
            <EuiLink onClick={showModal} data-test-subj="viewAllErrorLink">
              {i18n.translate('explore.traces.error.viewErrorDetails', {
                defaultMessage: 'View error details',
              })}
            </EuiLink>
          </>
        )}
      </p>

      {isModalVisible && (
        <EuiModal onClose={closeModal} maxWidth={800}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              {i18n.translate('explore.traces.error.modalTitle', {
                defaultMessage: 'Error Details',
              })}
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiCodeBlock language="text" isCopyable paddingSize="m" overflowHeight={600}>
              {errorString}
            </EuiCodeBlock>
          </EuiModalBody>
        </EuiModal>
      )}
    </>
  );
};
