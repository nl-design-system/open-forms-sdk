import React, {useContext} from 'react';
import {Outlet, useLocation} from 'react-router-dom';

import {ConfigContext} from 'Context';
import Card from 'components/Card';
import ErrorBoundary from 'components/ErrorBoundary';
import FormDisplay from 'components/FormDisplay';
import Loader from 'components/Loader';
import {RequireSession} from 'components/Sessions';
import {flagNoActiveSubmission} from 'data/submissions';
import useGetOrCreateSubmission from 'hooks/useGetOrCreateSubmission';
import useSessionTimeout from 'hooks/useSessionTimeout';
import Types from 'types';

import {AppointmentConfigContext} from '../Context';
import AppointmentProgress from './AppointmentProgress';
import CreateAppointmentState from './CreateAppointmentState';
import {APPOINTMENT_STEP_PATHS, checkMatchesPath} from './routes';

// TODO on submission to backend -> summary component
// TODO: post to API endpoint, handle validation errors
// window.sessionStorage.clearItem(storageKey);
// removeSubmissionFromStorage();
// resetSession();

const CreateAppointment = ({form}) => {
  const {isLoading, error, submission, removeSubmissionFromStorage} =
    useGetOrCreateSubmission(form);
  if (error) throw error;

  const [sessionExpired, expiryDate, resetSession] = useSessionTimeout(() => {
    removeSubmissionFromStorage();
    flagNoActiveSubmission();
  });

  const config = useContext(ConfigContext);
  const FormDisplayComponent = config?.displayComponents?.form ?? FormDisplay;
  const supportsMultipleProducts = form?.appointmentOptions.supportsMultipleProducts ?? false;

  const {pathname: currentPathname} = useLocation();
  const currentStep =
    APPOINTMENT_STEP_PATHS.find(step => checkMatchesPath(currentPathname, step)) ||
    APPOINTMENT_STEP_PATHS[0];

  return (
    <AppointmentConfigContext.Provider value={{supportsMultipleProducts}}>
      <CreateAppointmentState currentStep={currentStep} submission={submission}>
        <FormDisplayComponent
          router={
            <Wrapper sessionExpired={sessionExpired} title={form.name}>
              <ErrorBoundary>
                {isLoading ? (
                  <Loader modifiers={['centered']} />
                ) : (
                  <RequireSession
                    expired={sessionExpired}
                    expiryDate={expiryDate}
                    onNavigate={() => resetSession()}
                  >
                    <Outlet />
                  </RequireSession>
                )}
              </ErrorBoundary>
            </Wrapper>
          }
          progressIndicator={<AppointmentProgress title={form.name} currentStep={currentStep} />}
          showProgressIndicator={form.showProgressIndicator}
          isPaymentOverview={false}
        />
      </CreateAppointmentState>
    </AppointmentConfigContext.Provider>
  );
};

CreateAppointment.propTypes = {
  form: Types.Form.isRequired,
};

const Wrapper = ({sessionExpired = false, children, ...props}) => {
  if (sessionExpired) return <>{children}</>;

  return (
    <Card titleComponent="h1" modifiers={['mobile-header-hidden']} {...props}>
      {children}
    </Card>
  );
};

export default CreateAppointment;
