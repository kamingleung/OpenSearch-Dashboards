# Test Requirements for Error Message Modal Feature

## Overview
This document outlines the required tests for the error message truncation and modal feature added to the Explore traces chart component.

## Changes Summary
- **New Component**: `ErrorMessageModal` - Truncates long error messages and provides a modal to view full details
- **Modified Component**: `ExploreTracesChart` - Integrated `ErrorMessageModal` for displaying error messages in three chart sections (Request Count, Error Count, Latency)

## Required Tests

### 1. Unit Tests for `ErrorMessageModal` Component

**File**: `src/plugins/explore/public/components/chart/error_message_modal.test.tsx` (NEW)

#### Test Cases:

##### 1.1 Basic Rendering
- [ ] **Should render short error messages without truncation**
  - Error message < 30 characters
  - No "View error details" link should appear
  - Full message displayed inline

- [ ] **Should truncate long error messages**
  - Error message > 30 characters (default maxLength)
  - Should display first 30 characters + "..."
  - "View error details" link should be visible

- [ ] **Should respect custom maxLength prop**
  - Pass custom maxLength (e.g., 50)
  - Verify truncation at correct length

##### 1.2 Modal Interaction
- [ ] **Should open modal when "View error details" link is clicked**
  - Click link with `data-test-subj="viewAllErrorLink"`
  - Modal should become visible
  - Modal should contain full error message

- [ ] **Should close modal when close button is clicked**
  - Open modal
  - Click close button
  - Modal should disappear

- [ ] **Should display full error message in modal**
  - Verify EuiCodeBlock contains complete error text
  - Verify modal title is "Error Details"

##### 1.3 Error Message Handling
- [ ] **Should handle string error messages**
  - Pass string directly
  - Verify correct display

- [ ] **Should handle non-string error messages**
  - Pass object/number/etc
  - Should convert to JSON string
  - Verify JSON.stringify is called with proper formatting

- [ ] **Should handle empty error messages**
  - Pass empty string
  - Should render without crashing

- [ ] **Should handle very long error messages in modal**
  - Pass error > 1000 characters
  - Verify modal scrolling works (overflowHeight prop)

##### 1.4 Accessibility
- [ ] **Should have proper ARIA labels**
  - Link should be keyboard accessible
  - Modal should be properly labeled

- [ ] **Should support word breaking for long words**
  - Verify CSS properties: wordBreak, overflowWrap

##### 1.5 Internationalization
- [ ] **Should use i18n for all text**
  - "View error details" link text
  - "Error Details" modal title
  - Verify i18n keys exist

---

### 2. Integration Tests for `ExploreTracesChart` Component

**File**: `src/plugins/explore/public/components/chart/explore_traces_chart.test.tsx` (UPDATE)

#### Test Cases:

##### 2.1 Error Message Display in Request Count Chart
- [ ] **Should display truncated error in Request Count callout**
  - Pass long error in `requestError` prop
  - Verify ErrorMessageModal is rendered
  - Verify truncation occurs

- [ ] **Should open modal for Request Count errors**
  - Click "View error details" link
  - Verify modal shows full error

##### 2.2 Error Message Display in Error Count Chart
- [ ] **Should display truncated error in Error Count callout**
  - Pass long error in `errorQueryError` prop
  - Verify ErrorMessageModal is rendered

- [ ] **Should open modal for Error Count errors**
  - Click "View error details" link
  - Verify modal shows full error

##### 2.3 Error Message Display in Latency Chart
- [ ] **Should display truncated error in Latency callout**
  - Pass long error in `latencyError` prop
  - Verify ErrorMessageModal is rendered

- [ ] **Should open modal for Latency errors**
  - Click "View error details" link
  - Verify modal shows full error

##### 2.4 Multiple Errors Simultaneously
- [ ] **Should handle multiple error modals independently**
  - Pass errors to all three charts
  - Open modal for one error
  - Verify only that modal opens
  - Close and open another
  - Verify independent state management

##### 2.5 Error Message Fallbacks
- [ ] **Should use originalErrorMessage when available**
  - Pass error with `originalErrorMessage` field
  - Verify it's displayed first

- [ ] **Should fall back to message.details**
  - Pass error without `originalErrorMessage` but with `message.details`
  - Verify fallback works

- [ ] **Should fall back to error field**
  - Pass error with only `error` field
  - Verify fallback works

- [ ] **Should use i18n fallback message**
  - Pass error without any message fields
  - Verify default i18n message is used

##### 2.6 Backward Compatibility
- [ ] **Should still render existing error scenarios correctly**
  - Field missing errors (durationInNanos, status, endTime)
  - Generic server errors
  - Verify no regression in existing tests

---

### 3. Visual Regression Tests (Optional but Recommended)

**File**: `test/visual_regression/tests/explore_traces_chart.ts` (NEW or UPDATE)

#### Test Cases:
- [ ] **Screenshot of truncated error message**
- [ ] **Screenshot of opened error modal**
- [ ] **Screenshot of multiple errors displayed**

---

### 4. End-to-End Tests

**File**: `cypress/integration/without_security/explore_traces.spec.ts` (NEW or UPDATE)

#### Test Cases:

##### 4.1 User Workflow
- [ ] **Should display and interact with error modal in real scenario**
  - Navigate to Explore > Traces
  - Trigger an error condition (e.g., query with missing field)
  - Verify truncated error appears
  - Click "View error details"
  - Verify modal opens with full error
  - Close modal
  - Verify modal closes

##### 4.2 Error Recovery
- [ ] **Should allow user to continue after viewing error**
  - View error in modal
  - Close modal
  - Modify query
  - Verify charts reload correctly

---

## Test Implementation Priority

### High Priority (Must Have for Merge)
1. ✅ Unit tests for `ErrorMessageModal` component (1.1, 1.2, 1.3)
2. ✅ Integration tests for error display in all three charts (2.1, 2.2, 2.3)
3. ✅ Error message fallback tests (2.5)
4. ✅ Backward compatibility tests (2.6)

### Medium Priority (Should Have)
5. Multiple error modal tests (2.4)
6. Accessibility tests (1.4)
7. Internationalization tests (1.5)

### Low Priority (Nice to Have)
8. Visual regression tests (3)
9. E2E tests (4)

---

## Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% for new `ErrorMessageModal` component
- **Integration Test Coverage**: All error paths in `ExploreTracesChart` should be tested
- **No Regression**: All existing tests must continue to pass

---

## Running Tests

```bash
# Run unit tests for the specific component
yarn test:jest src/plugins/explore/public/components/chart/error_message_modal.test.tsx

# Run integration tests
yarn test:jest src/plugins/explore/public/components/chart/explore_traces_chart.test.tsx

# Run all explore plugin tests
yarn test:jest src/plugins/explore

# Run with coverage
yarn test:jest --coverage src/plugins/explore/public/components/chart/
```

---

## Acceptance Criteria

Before merging to main, ensure:

- [ ] All high-priority tests are implemented and passing
- [ ] Test coverage meets minimum 80% for new code
- [ ] All existing tests continue to pass (no regressions)
- [ ] Tests follow existing patterns in the codebase
- [ ] Mock setup is consistent with other test files
- [ ] i18n keys are properly tested
- [ ] Accessibility requirements are validated
- [ ] Documentation is updated if needed

---

## Additional Considerations

### Mock Requirements
- Mock `@elastic/eui` components (EuiModal, EuiLink, EuiCodeBlock)
- Mock i18n translation function
- Use existing Redux store setup from current tests

### Test Data
Create realistic error message examples:
- Short error: "Connection timeout"
- Long error: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos) in type env. This error occurred because the field is not present in the current dataset schema. Please verify that your data source contains this field."
- JSON error object: `{ statusCode: 400, message: { details: "..." } }`

### Edge Cases to Test
- Empty error messages
- Null/undefined error messages
- Very long error messages (>5000 characters)
- Error messages with special characters
- Error messages with HTML/script tags (XSS prevention)
