/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  legacyReducer,
  uiReducer,
  queryReducer,
  resultsReducer,
  queryEditorReducer,
} from '../../application/utils/state_management/slices';

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      uiSettings: { get: jest.fn() },
      data: {
        query: {
          timefilter: {
            timefilter: {
              getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
            },
          },
        },
      },
    },
  })),
  withOpenSearchDashboards: jest.fn((component) => component),
}));

jest.mock('./histogram/histogram', () => ({
  DiscoverHistogram: ({ chartData }: { chartData: any }) => (
    <div data-test-subj="discover-histogram">
      Chart with {chartData?.values?.length || 0} data points
    </div>
  ),
}));

jest.mock('./timechart_header', () => ({
  TimechartHeader: () => <div data-test-subj="timechart-header">Timechart Header</div>,
}));

jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiCallOut: ({ title, children, color }: any) => (
    <div data-test-subj={`eui-callout-${color}`}>
      <div>{title}</div>
      <div>{children}</div>
    </div>
  ),
  EuiLoadingSpinner: () => <div role="progressbar">Loading...</div>,
}));

// Import after mocks
import { ExploreTracesChart } from './explore_traces_chart';

describe('ExploreTracesChart - Field Missing Error Messages', () => {
  const mockStore = configureStore({
    reducer: {
      legacy: legacyReducer,
      ui: uiReducer,
      query: queryReducer,
      results: resultsReducer,
      queryEditor: queryEditorReducer,
    },
    preloadedState: {
      legacy: {
        savedSearch: undefined,
        savedQuery: undefined,
        columns: [],
        sort: [],
        interval: '5m',
        isDirty: false,
        lineCount: undefined,
      },
      ui: {
        activeTabId: 'traces',
        showHistogram: true,
      },
      query: {
        query: 'source=traces',
        language: 'PPL',
        dataset: {
          id: 'trace-dataset',
          title: 'trace-dataset',
          type: 'INDEX_PATTERN',
        },
      },
      queryEditor: {
        breakdownField: undefined,
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'READY' as any,
          elapsedMs: 100,
          startTime: Date.now(),
        },
        editorMode: 'Query' as any,
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        summaryAgentIsAvailable: false,
        lastExecutedPrompt: '',
        lastExecutedTranslatedQuery: '',
        queryExecutionButtonStatus: 'REFRESH',
        isQueryEditorDirty: false,
        hasUserInitiatedQuery: false,
      },
      results: {},
    },
  });

  const defaultProps = {
    bucketInterval: { scale: 1, description: '5m' },
    config: { get: jest.fn() } as any,
    data: {
      query: {
        timefilter: {
          timefilter: {
            getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
          },
        },
      },
    } as any,
    services: {} as any,
    showHistogram: true,
    timeFieldName: 'endTime',
  };

  it('displays error message when durationInNanos field is missing from dataset', () => {
    const latencyError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos)",
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
          errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
          latencyChartData={undefined}
          latencyError={latencyError}
        />
      </Provider>
    );

    expect(screen.getByText('Latency Unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/Duration field "durationInNanos" not found in this dataset/)
    ).toBeInTheDocument();
    expect(screen.getByText(/This field is required for latency metrics/)).toBeInTheDocument();

    // Other charts should still render normally
    expect(screen.getAllByTestId('discover-histogram')).toHaveLength(2); // Request and error charts
  });

  it('displays error message when status field is missing from dataset', () => {
    const errorQueryError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=status) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=status)",
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
          errorChartData={undefined}
          latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
          errorQueryError={errorQueryError}
        />
      </Provider>
    );

    expect(screen.getByText('Error Count Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Status field "status" not found in this dataset/)).toBeInTheDocument();
    expect(screen.getByText(/This field is required for error metrics/)).toBeInTheDocument();

    // Other charts should still render normally
    expect(screen.getAllByTestId('discover-histogram')).toHaveLength(2); // Request and latency charts
  });

  it('displays error message when time field is missing from dataset', () => {
    const requestError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=endTime) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=endTime)",
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={undefined}
          errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
          latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
          requestError={requestError}
          timeFieldName="endTime"
        />
      </Provider>
    );

    expect(screen.getByText('Request Count Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Time field "endTime" not found in this dataset/)).toBeInTheDocument();
    expect(screen.getByText(/This field is required for time-based metrics/)).toBeInTheDocument();

    // Other charts should still render normally
    expect(screen.getAllByTestId('discover-histogram')).toHaveLength(2); // Error and latency charts
  });

  it('displays error message with custom time field name', () => {
    const requestError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=@timestamp) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=@timestamp)",
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={undefined}
          errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
          latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
          requestError={requestError}
          timeFieldName="@timestamp"
        />
      </Provider>
    );

    // Should use the actual time field name in the error message
    expect(
      screen.getByText(/Time field "@timestamp" not found in this dataset/)
    ).toBeInTheDocument();
  });

  it('displays multiple field missing error messages simultaneously', () => {
    const requestError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=endTime) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=endTime)",
    };

    const errorQueryError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=status) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=status)",
    };

    const latencyError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos)",
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={undefined}
          errorChartData={undefined}
          latencyChartData={undefined}
          requestError={requestError}
          errorQueryError={errorQueryError}
          latencyError={latencyError}
        />
      </Provider>
    );

    expect(screen.getByText('Request Count Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Error Count Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Latency Unavailable')).toBeInTheDocument();

    expect(screen.getByText(/Time field "endTime" not found/)).toBeInTheDocument();
    expect(screen.getByText(/Status field "status" not found/)).toBeInTheDocument();
    expect(screen.getByText(/Duration field "durationInNanos" not found/)).toBeInTheDocument();

    // No charts should render
    expect(screen.queryByTestId('discover-histogram')).not.toBeInTheDocument();
  });

  it('handles non-field-missing errors gracefully', () => {
    const genericError = {
      statusCode: 500,
      error: 'Internal Server Error',
      message: {
        details: 'Some other error occurred',
        reason: 'ServerException',
        type: 'ServerException',
      },
      originalErrorMessage: 'Some other error occurred',
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={undefined}
          errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
          latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
          requestError={genericError}
        />
      </Provider>
    );

    // Should show actual error message instead of infinite loading spinner
    expect(screen.getByText('Request Count Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Some other error occurred')).toBeInTheDocument();
    expect(screen.queryByText(/not found in this dataset/)).not.toBeInTheDocument();

    // Other charts should still render normally
    expect(screen.getAllByTestId('discover-histogram')).toHaveLength(2);
  });

  it('renders charts normally when no errors are present', () => {
    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={{ values: [{ x: 1, y: 10 }], xAxisOrderedValues: [] } as any}
          errorChartData={{ values: [{ x: 1, y: 2 }], xAxisOrderedValues: [] } as any}
          latencyChartData={{ values: [{ x: 1, y: 1.5 }], xAxisOrderedValues: [] } as any}
        />
      </Provider>
    );

    // Should render all three charts
    expect(screen.getAllByTestId('discover-histogram')).toHaveLength(3);
    expect(screen.queryByText(/Unavailable/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

describe('ExploreTracesChart - ErrorMessageModal Integration', () => {
  const mockStore = configureStore({
    reducer: {
      legacy: legacyReducer,
      ui: uiReducer,
      query: queryReducer,
      results: resultsReducer,
      queryEditor: queryEditorReducer,
    },
    preloadedState: {
      legacy: {
        savedSearch: undefined,
        savedQuery: undefined,
        columns: [],
        sort: [],
        interval: '5m',
        isDirty: false,
        lineCount: undefined,
      },
      ui: {
        activeTabId: 'traces',
        showHistogram: true,
      },
      query: {
        query: 'source=traces',
        language: 'PPL',
        dataset: {
          id: 'trace-dataset',
          title: 'trace-dataset',
          type: 'INDEX_PATTERN',
        },
      },
      queryEditor: {
        breakdownField: undefined,
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'READY' as any,
          elapsedMs: 100,
          startTime: Date.now(),
        },
        editorMode: 'Query' as any,
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        summaryAgentIsAvailable: false,
        lastExecutedPrompt: '',
        lastExecutedTranslatedQuery: '',
        queryExecutionButtonStatus: 'REFRESH',
        isQueryEditorDirty: false,
        hasUserInitiatedQuery: false,
      },
      results: {},
    },
  });

  const defaultProps = {
    bucketInterval: { scale: 1, description: '5m' },
    config: { get: jest.fn() } as any,
    data: {
      query: {
        timefilter: {
          timefilter: {
            getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
          },
        },
      },
    } as any,
    services: {} as any,
    showHistogram: true,
    timeFieldName: 'endTime',
  };

  describe('Request Count Chart Error Display', () => {
    it('should display truncated error in Request Count callout', () => {
      const longError =
        "can't resolve Symbol(namespace=FIELD_NAME, name=endTime) in type env. This is a very long error message that should be truncated to improve readability and user experience.";
      const requestError = {
        statusCode: 400,
        error: 'Bad Request',
        message: { details: longError },
        originalErrorMessage: longError,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={undefined}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            requestError={requestError}
          />
        </Provider>
      );

      // Should show truncated version
      expect(screen.getByText(/can't resolve Symbol\(namespa\.\.\./)).toBeInTheDocument();
      expect(screen.getByTestId('viewAllErrorLink')).toBeInTheDocument();
    });

    it('should open modal for Request Count errors', () => {
      const longError =
        "can't resolve Symbol(namespace=FIELD_NAME, name=endTime) in type env. This is a very long error message.";
      const requestError = {
        statusCode: 400,
        error: 'Bad Request',
        originalErrorMessage: longError,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={undefined}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            requestError={requestError}
          />
        </Provider>
      );

      // Click "View error details" link
      const link = screen.getByTestId('viewAllErrorLink');
      fireEvent.click(link);

      // Modal should open with full error
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText(longError)).toBeInTheDocument();
    });
  });

  describe('Error Count Chart Error Display', () => {
    it('should display truncated error in Error Count callout', () => {
      const longError =
        "can't resolve Symbol(namespace=FIELD_NAME, name=status) in type env. This is a very long error message that should be truncated.";
      const errorQueryError = {
        statusCode: 400,
        error: 'Bad Request',
        originalErrorMessage: longError,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
            errorChartData={undefined}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            errorQueryError={errorQueryError}
          />
        </Provider>
      );

      // Should show truncated version
      expect(screen.getByText(/can't resolve Symbol\(namespa\.\.\./)).toBeInTheDocument();
      expect(screen.getByTestId('viewAllErrorLink')).toBeInTheDocument();
    });

    it('should open modal for Error Count errors', () => {
      const longError =
        "can't resolve Symbol(namespace=FIELD_NAME, name=status) in type env. This is a very long error message.";
      const errorQueryError = {
        statusCode: 400,
        error: 'Bad Request',
        originalErrorMessage: longError,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
            errorChartData={undefined}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            errorQueryError={errorQueryError}
          />
        </Provider>
      );

      // Click "View error details" link
      const link = screen.getByTestId('viewAllErrorLink');
      fireEvent.click(link);

      // Modal should open with full error
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText(longError)).toBeInTheDocument();
    });
  });

  describe('Latency Chart Error Display', () => {
    it('should display truncated error in Latency callout', () => {
      const longError =
        "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos) in type env. This is a very long error message that should be truncated.";
      const latencyError = {
        statusCode: 400,
        error: 'Bad Request',
        originalErrorMessage: longError,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={undefined}
            latencyError={latencyError}
          />
        </Provider>
      );

      // Should show truncated version
      expect(screen.getByText(/can't resolve Symbol\(namespa\.\.\./)).toBeInTheDocument();
      expect(screen.getByTestId('viewAllErrorLink')).toBeInTheDocument();
    });

    it('should open modal for Latency errors', () => {
      const longError =
        "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos) in type env. This is a very long error message.";
      const latencyError = {
        statusCode: 400,
        error: 'Bad Request',
        originalErrorMessage: longError,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={undefined}
            latencyError={latencyError}
          />
        </Provider>
      );

      // Click "View error details" link
      const link = screen.getByTestId('viewAllErrorLink');
      fireEvent.click(link);

      // Modal should open with full error
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText(longError)).toBeInTheDocument();
    });
  });

  describe('Multiple Errors Simultaneously', () => {
    it('should handle multiple error modals independently', () => {
      const requestErrorMsg =
        'Request error: This is a very long error message for the request count chart that should be truncated.';
      const errorQueryErrorMsg =
        'Error query error: This is a very long error message for the error count chart that should be truncated.';
      const latencyErrorMsg =
        'Latency error: This is a very long error message for the latency chart that should be truncated.';

      const requestError = {
        statusCode: 400,
        error: 'Bad Request',
        originalErrorMessage: requestErrorMsg,
      };

      const errorQueryError = {
        statusCode: 400,
        error: 'Bad Request',
        originalErrorMessage: errorQueryErrorMsg,
      };

      const latencyError = {
        statusCode: 400,
        error: 'Bad Request',
        originalErrorMessage: latencyErrorMsg,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={undefined}
            errorChartData={undefined}
            latencyChartData={undefined}
            requestError={requestError}
            errorQueryError={errorQueryError}
            latencyError={latencyError}
          />
        </Provider>
      );

      // All three should show truncated errors with links
      const links = screen.getAllByTestId('viewAllErrorLink');
      expect(links).toHaveLength(3);

      // Click first link (Request Count error)
      fireEvent.click(links[0]);

      // Should show request error in modal
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText(requestErrorMsg)).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      // Modal should be closed
      expect(screen.queryByText('Error Details')).not.toBeInTheDocument();

      // Click second link (Error Count error)
      fireEvent.click(links[1]);

      // Should show error query error in modal
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText(errorQueryErrorMsg)).toBeInTheDocument();
    });
  });

  describe('Error Message Fallbacks', () => {
    it('should use originalErrorMessage when available', () => {
      const originalMsg =
        'This is the original error message that is very long and should be truncated';
      const requestError = {
        statusCode: 400,
        error: 'Bad Request',
        message: { details: 'This should not be shown' },
        originalErrorMessage: originalMsg,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={undefined}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            requestError={requestError}
          />
        </Provider>
      );

      // Should show originalErrorMessage (truncated)
      expect(screen.getByText(/This is the original error\.\.\./)).toBeInTheDocument();
    });

    it('should fall back to message.details when originalErrorMessage is not available', () => {
      const detailsMsg = 'This is the message details that is very long and should be truncated';
      const requestError = {
        statusCode: 400,
        error: 'Bad Request',
        message: { details: detailsMsg },
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={undefined}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            requestError={requestError}
          />
        </Provider>
      );

      // Should show message.details (truncated)
      expect(screen.getByText(/This is the message detail\.\.\./)).toBeInTheDocument();
    });

    it('should fall back to error field when originalErrorMessage and message.details are not available', () => {
      const errorMsg = 'This is the error field that is very long and should be truncated';
      const requestError = {
        statusCode: 400,
        error: errorMsg,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={undefined}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            requestError={requestError}
          />
        </Provider>
      );

      // Should show error field (truncated)
      expect(screen.getByText(/This is the error field th\.\.\./)).toBeInTheDocument();
    });

    it('should use i18n fallback message when no error fields are available', () => {
      const requestError = {
        statusCode: 400,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={undefined}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            requestError={requestError}
          />
        </Provider>
      );

      // Should show i18n fallback message
      expect(
        screen.getByText(/Failed to load request count data. Please try again or check your query./)
      ).toBeInTheDocument();
    });
  });

  describe('Short Error Messages', () => {
    it('should not truncate short error messages in Request Count', () => {
      const shortError = 'Connection timeout';
      const requestError = {
        statusCode: 500,
        error: 'Server Error',
        originalErrorMessage: shortError,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={undefined}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            requestError={requestError}
          />
        </Provider>
      );

      // Should show full error without truncation
      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
      expect(screen.queryByTestId('viewAllErrorLink')).not.toBeInTheDocument();
    });

    it('should not truncate short error messages in Error Count', () => {
      const shortError = 'Query failed';
      const errorQueryError = {
        statusCode: 500,
        error: 'Server Error',
        originalErrorMessage: shortError,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
            errorChartData={undefined}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            errorQueryError={errorQueryError}
          />
        </Provider>
      );

      // Should show full error without truncation
      expect(screen.getByText('Query failed')).toBeInTheDocument();
      expect(screen.queryByTestId('viewAllErrorLink')).not.toBeInTheDocument();
    });

    it('should not truncate short error messages in Latency', () => {
      const shortError = 'Timeout';
      const latencyError = {
        statusCode: 500,
        error: 'Server Error',
        originalErrorMessage: shortError,
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={undefined}
            latencyError={latencyError}
          />
        </Provider>
      );

      // Should show full error without truncation
      expect(screen.getByText('Timeout')).toBeInTheDocument();
      expect(screen.queryByTestId('viewAllErrorLink')).not.toBeInTheDocument();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing behavior for field-missing errors', () => {
      const fieldMissingError = {
        statusCode: 400,
        error: 'Bad Request',
        message: {
          details: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos) in type env",
          reason: 'SemanticCheckException',
          type: 'SemanticCheckException',
        },
        originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos)",
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={undefined}
            latencyError={fieldMissingError}
          />
        </Provider>
      );

      // Should still show the special field-missing error message
      expect(screen.getByText('Latency Unavailable')).toBeInTheDocument();
      expect(
        screen.getByText(/Duration field "durationInNanos" not found in this dataset/)
      ).toBeInTheDocument();
    });

    it('should handle generic errors with ErrorMessageModal', () => {
      const genericError = {
        statusCode: 500,
        error: 'Internal Server Error',
        message: {
          details:
            'Database connection failed. Please check your connection settings and try again.',
          reason: 'ServerException',
          type: 'ServerException',
        },
        originalErrorMessage:
          'Database connection failed. Please check your connection settings and try again.',
      };

      render(
        <Provider store={mockStore}>
          <ExploreTracesChart
            {...defaultProps}
            requestChartData={undefined}
            errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
            latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
            requestError={genericError}
          />
        </Provider>
      );

      // Should show truncated error with modal link
      expect(screen.getByText(/Database connection failed\.\.\./)).toBeInTheDocument();
      expect(screen.getByTestId('viewAllErrorLink')).toBeInTheDocument();
    });
  });
});
