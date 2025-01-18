import PropTypes from 'prop-types';
import React, {useContext, useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import {
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {useAsync, usePrevious} from 'react-use';

import {AnalyticsToolsConfigContext, ConfigContext} from 'Context';
import {destroy, get} from 'api';
import Loader from 'components/Loader';
import ProgressIndicator from 'components/ProgressIndicator';
import {
  PI_TITLE,
  START_FORM_QUERY_PARAM,
  STEP_LABELS,
  SUBMISSION_ALLOWED,
} from 'components/constants';
import {flagActiveSubmission, flagNoActiveSubmission} from 'data/submissions';
import useAutomaticRedirect from 'hooks/useAutomaticRedirect';
import useFormContext from 'hooks/useFormContext';
import usePageViews from 'hooks/usePageViews';
import useRecycleSubmission from 'hooks/useRecycleSubmission';
import Types from 'types';

import FormDisplay from './FormDisplay';
import {addFixedSteps, getStepsInfo} from './ProgressIndicator/utils';

/**
 * An OpenForms form.
 *
 *
 * OpenForms forms consist of some metadata and individual steps.
 * @param  {Object} options.form The form definition from the Open Forms API
 * @return {JSX}
 */
const Form = () => {
  const form = useFormContext();
  const navigate = useNavigate();
  const shouldAutomaticallyRedirect = useAutomaticRedirect(form);
  const [params] = useSearchParams();
  usePageViews();
  const intl = useIntl();
  const prevLocale = usePrevious(intl.locale);
  const {pathname: currentPathname, state: routerState} = useLocation();

  // TODO replace absolute path check with relative
  const introductionMatch = useMatch('/introductie');
  const stepMatch = useMatch('/stap/:step');
  const summaryMatch = useMatch('/overzicht');
  const paymentMatch = useMatch('/betalen');
  const confirmationMatch = useMatch('/bevestiging');

  // extract the declared properties and configuration
  const config = useContext(ConfigContext);

  // load the state management/reducer
  const submissionFromRouterState = routerState?.submission;
  const [submission, setSubmission] = useState(null);
  if (submission == null && submissionFromRouterState != null) {
    setSubmission(submissionFromRouterState);
  }

  const onSubmissionLoaded = submission => {
    setSubmission(submission);
    flagActiveSubmission();
  };

  // if there is an active submission still, re-load that (relevant for hard-refreshes)
  const [loading, setSubmissionId, removeSubmissionId] = useRecycleSubmission(
    form,
    submission,
    onSubmissionLoaded
  );

  const {value: analyticsToolsConfigInfo, loading: loadingAnalyticsConfig} = useAsync(async () => {
    return await get(`${config.baseUrl}analytics/analytics-tools-config-info`);
  }, [intl.locale]);

  useEffect(
    () => {
      if (prevLocale === undefined) return;
      if (intl.locale !== prevLocale && submission) {
        removeSubmissionId();
        setSubmission(null);
        flagNoActiveSubmission();
        navigate(`/?${START_FORM_QUERY_PARAM}=1`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intl.locale, prevLocale, removeSubmissionId, submission]
  );

  const onDestroySession = async () => {
    await destroy(`${config.baseUrl}authentication/${submission.id}/session`);
    removeSubmissionId();
    setSubmission(null);
    navigate('/');
  };

  // handle redirect from payment provider to render appropriate page and include the
  // params as state for the next component.
  if (params.get('of_payment_status')) {
    // TODO: store details in sessionStorage instead, to survive hard refreshes
    return (
      <Navigate
        replace
        to="/bevestiging"
        state={{
          status: params.get('of_payment_status'),
          userAction: params.get('of_payment_action'),
          statusUrl: params.get('of_submission_status'),
        }}
      />
    );
  }

  if (loading || loadingAnalyticsConfig || shouldAutomaticallyRedirect) {
    return <Loader modifiers={['centered']} />;
  }

  // Progress Indicator

  const isIntroductionPage = !!introductionMatch;
  const isStartPage = !isIntroductionPage && !summaryMatch && stepMatch == null && !paymentMatch;
  const submissionAllowedSpec = submission?.submissionAllowed ?? form.submissionAllowed;
  const showOverview = submissionAllowedSpec !== SUBMISSION_ALLOWED.noWithoutOverview;
  const formName = form.name;
  const needsPayment = submission ? submission.payment.isRequired : form.paymentRequired;

  // Figure out the slug from the currently active step IF we're looking at a step
  const stepSlug = stepMatch ? stepMatch.params.step : '';

  // figure out the title for the mobile menu based on the state
  let activeStepTitle;
  if (isIntroductionPage) {
    activeStepTitle = intl.formatMessage(STEP_LABELS.introduction);
  } else if (isStartPage) {
    activeStepTitle = intl.formatMessage(STEP_LABELS.login);
  } else if (summaryMatch) {
    activeStepTitle = intl.formatMessage(STEP_LABELS.overview);
  } else if (paymentMatch) {
    activeStepTitle = intl.formatMessage(STEP_LABELS.payment);
  } else {
    const step = form.steps.find(step => step.slug === stepSlug);
    activeStepTitle = step.formDefinition;
  }

  const ariaMobileIconLabel = intl.formatMessage({
    description: 'Progress step indicator toggle icon (mobile)',
    defaultMessage: 'Toggle the progress status display',
  });

  const accessibleToggleStepsLabel = intl.formatMessage(
    {
      description: 'Active step accessible label in mobile progress indicator',
      defaultMessage: 'Current step in form {formName}: {activeStepTitle}',
    },
    {formName, activeStepTitle}
  );

  // process the form/submission steps information into step data that can be passed
  // to the progress indicator.
  // If the form is marked to not display non-applicable steps at all, filter them out.
  const showNonApplicableSteps = !form.hideNonApplicableSteps;
  const updatedSteps =
    // first, process all the form steps in a format suitable for the PI
    getStepsInfo(form.steps, submission, currentPathname)
      // then, filter out the non-applicable steps if they should not be displayed
      .filter(step => showNonApplicableSteps || step.isApplicable);

  // the statusUrl is put in the router state once the summary page is confirmed and the
  // submission is completed.
  const isCompleted = !!routerState?.statusUrl;
  const stepsToRender = addFixedSteps(
    intl,
    updatedSteps,
    submission,
    currentPathname,
    showOverview,
    needsPayment,
    isCompleted,
    !!form.introductionPageContent
  );

  // Show the progress indicator if enabled on the form AND we're not in the payment
  // confirmation screen.
  const progressIndicator =
    form.showProgressIndicator && !confirmationMatch ? (
      <ProgressIndicator
        title={PI_TITLE}
        formTitle={formName}
        steps={stepsToRender}
        ariaMobileIconLabel={ariaMobileIconLabel}
        accessibleToggleStepsLabel={accessibleToggleStepsLabel}
      />
    ) : null;

  // render the form step if there's an active submission (and no summary)
  return (
    <FormDisplay progressIndicator={progressIndicator}>
      <AnalyticsToolsConfigContext.Provider value={analyticsToolsConfigInfo}>
        <SubmissionProvider
          submission={submission}
          onSubmissionObtained={submission => {
            onSubmissionLoaded(submission);
            setSubmissionId(submission.id);
          }}
          onDestroySession={onDestroySession}
          removeSubmissionId={removeSubmissionId}
        >
          <Outlet />
        </SubmissionProvider>
      </AnalyticsToolsConfigContext.Provider>
    </FormDisplay>
  );
};

Form.propTypes = {};

const SubmissionContext = React.createContext({
  submission: null,
  onSubmissionObtained: () => {},
  onDestroySession: () => {},
  removeSubmissionId: () => {},
});

const SubmissionProvider = ({
  submission = null,
  onSubmissionObtained,
  onDestroySession,
  removeSubmissionId,
  children,
}) => (
  <SubmissionContext.Provider
    value={{submission, onSubmissionObtained, onDestroySession, removeSubmissionId}}
  >
    {children}
  </SubmissionContext.Provider>
);

SubmissionProvider.propTypes = {
  /**
   * The submission currently being filled out / submitted / viewed. It must exist in
   * the backend session.
   */
  submission: Types.Submission,
  /**
   * Callback for when a submission was (re-)loaded to store it in the state.
   */
  onSubmissionObtained: PropTypes.func.isRequired,
  /**
   * Callback for when an abort/logout/stop button is clicked which terminates the
   * form submission / session.
   */
  onDestroySession: PropTypes.func.isRequired,
  /**
   * Callback to remove the submission reference (it's ID) from the local storage.
   */
  removeSubmissionId: PropTypes.func.isRequired,
};

const useSubmissionContext = () => useContext(SubmissionContext);

export default Form;
export {useSubmissionContext, SubmissionProvider};
