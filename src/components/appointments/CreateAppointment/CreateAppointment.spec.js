import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import messagesEN from 'i18n/compiled/en.json';
import {IntlProvider} from 'react-intl';
import {RouterProvider, createMemoryRouter} from 'react-router-dom';

import {ConfigContext, FormContext} from 'Context';
import {updateSessionExpiry} from 'api';
import {BASE_URL, buildForm} from 'api-mocks';
import mswServer from 'api-mocks/msw-server';
import {buildSubmission, mockSubmissionPost} from 'api-mocks/submissions';
import {mockSubmissionProcessingStatusErrorGet} from 'api-mocks/submissions';
import App, {routes as nestedRoutes} from 'components/App';
import {SESSION_STORAGE_KEY as SUBMISSION_SESSION_STORAGE_KEY} from 'hooks/useGetOrCreateSubmission';

import {
  mockAppointmentCustomerFieldsGet,
  mockAppointmentDatesGet,
  mockAppointmentLocationsGet,
  mockAppointmentPost,
  mockAppointmentProductsGet,
  mockAppointmentTimesGet,
} from '../mocks';
import {SESSION_STORAGE_KEY as APPOINTMENT_SESSION_STORAGE_KEY} from './CreateAppointmentState';

// scrollIntoView is not not supported in Jest
let scrollIntoViewMock = jest.fn();
window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

const routes = [
  {
    path: '*',
    element: <App />,
    children: nestedRoutes,
  },
];

const renderApp = (initialRoute = '/') => {
  const form = buildForm({
    appointmentOptions: {
      isAppointment: true,
      supportsMultipleProducts: true,
    },
  });
  const router = createMemoryRouter(routes, {
    initialEntries: [initialRoute],
    initialIndex: [0],
  });
  render(
    <ConfigContext.Provider
      value={{
        baseUrl: BASE_URL,
        clientBaseUrl: 'http://localhost/',
        basePath: '',
        baseTitle: '',
        requiredFieldsWithAsterisk: true,
        displayComponents: {},
      }}
    >
      <IntlProvider locale="en" messages={messagesEN}>
        <FormContext.Provider value={form}>
          <RouterProvider router={router} />
        </FormContext.Provider>
      </IntlProvider>
    </ConfigContext.Provider>
  );
};

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
});

describe('Create appointment session expiration', () => {
  it('resets the session storage/local state', async () => {
    const user = userEvent.setup({delay: null});
    mswServer.use(
      mockSubmissionPost(buildSubmission({steps: []})),
      mockAppointmentProductsGet,
      mockAppointmentLocationsGet,
      mockAppointmentDatesGet,
      mockAppointmentTimesGet
    );
    // initially render the app
    renderApp();

    // wait for submission to be created and recorded in the local storage
    await waitFor(() => {
      const submission = sessionStorage.getItem('appointment|submission');
      expect(submission).not.toBe('null');
    });

    // select a product
    const dropdowns = screen.getAllByRole('combobox');
    expect(dropdowns).toHaveLength(1);
    await user.click(dropdowns[0]);
    await user.keyboard('[ArrowDown]');
    const product = await screen.findByText('Paspoort aanvraag');
    expect(product).toBeVisible();
    await user.click(product);

    // submit and navigate to the next page
    await user.click(screen.getByRole('button', {name: 'Confirm products'}));

    // and wait until locations etc. are loaded
    await screen.findByLabelText('Location');

    // now finally let the session timeout in 1s
    act(() => updateSessionExpiry(1));
    await waitFor(async () => {
      await screen.findByText('Your session has expired');
    });

    // and click the link to restart...
    const restartLink = await screen.findByRole('link', {name: 'here'});
    await user.click(restartLink);

    // Here, take this if you need to figure out which keys are present
    // console.log(Object.entries(sessionStorage));

    // introspect session storage
    await waitFor(() => {
      const formData = sessionStorage.getItem('appointment|formData');
      expect(formData).toBe('{}');
    });
    await screen.findByText('Select your product(s)');

    const productDropdown = screen.getByRole('combobox');
    expect(productDropdown).toHaveDisplayValue('');
  });
});

describe('Create appointment status checking', () => {
  it('displays error status message on summary page', async () => {
    mswServer.use(
      mockAppointmentProductsGet,
      mockAppointmentLocationsGet,
      mockAppointmentCustomerFieldsGet,
      mockAppointmentPost,
      mockSubmissionProcessingStatusErrorGet
    );
    const user = userEvent.setup({delay: null});
    // set the appointment data in sessionStorage
    const submission = buildSubmission({steps: []});
    const appointmentData = {
      producten: {
        products: [{productId: '166a5c79', amount: 1}],
      },
      kalender: {
        location: '1396f17c',
        date: '2023-08-22',
        datetime: '2023-08-22T15:00:00+02:00',
      },
      contactgegevens: {lastName: 'Gem'},
    };
    sessionStorage.setItem(SUBMISSION_SESSION_STORAGE_KEY, JSON.stringify(submission));
    sessionStorage.setItem(APPOINTMENT_SESSION_STORAGE_KEY, JSON.stringify(appointmentData));

    renderApp('/afspraak-maken/overzicht');

    expect(await screen.findByText('Paspoort aanvraag')).toBeVisible();
    // check all checkboxes
    for (const checkbox of screen.getAllByRole('checkbox')) {
      await user.click(checkbox);
    }
    const submitButton = screen.getByRole('button', {name: 'Confirm'});
    expect(submitButton).toHaveAttribute('aria-disabled', 'false');

    await user.click(submitButton);
    await screen.findByText(/Processing/);
    // wait for summary page to be rendered again
    await screen.findByText('Check and confirm', undefined, {timeout: 2000});
    expect(screen.getByText('Computer says no.')).toBeVisible();
  });
});

describe('The create appointment wrapper', () => {
  it('prevents the ./kalender nested route from being accessed directly', async () => {
    mswServer.use(mockSubmissionPost(buildSubmission({steps: []})), mockAppointmentProductsGet);

    renderApp('/afspraak-maken/kalender');

    expect(await screen.findByRole('heading', {name: 'Select your product(s)'})).toBeVisible();
    expect(screen.queryByRole('heading', {name: 'Location and time'})).not.toBeInTheDocument();
  });

  it('prevents the ./contactgegevens nested route from being accessed directly', async () => {
    mswServer.use(mockSubmissionPost(buildSubmission({steps: []})), mockAppointmentProductsGet);

    renderApp('/afspraak-maken/contactgegevens');

    expect(await screen.findByRole('heading', {name: 'Select your product(s)'})).toBeVisible();
    expect(screen.queryByRole('heading', {name: 'Contact details'})).not.toBeInTheDocument();
  });
});

describe('Preselecting a product via querystring', () => {
  it('displays the preselected product in the dropdown', async () => {
    mswServer.use(mockSubmissionPost(buildSubmission({steps: []})), mockAppointmentProductsGet);

    renderApp('/?product=166a5c79');

    const productDropdown = await screen.findByRole('combobox');
    expect(productDropdown).toBeVisible();
    // and the product should be auto selected
    expect(await screen.findByText('Paspoort aanvraag')).toBeVisible();
  });

  it('does not crash on invalid product IDs', async () => {
    mswServer.use(mockSubmissionPost(buildSubmission({steps: []})), mockAppointmentProductsGet);
    const user = userEvent.setup({delay: null});

    renderApp('/?product=bb72a36b-b791');

    const productDropdown = await screen.findByRole('combobox');
    expect(productDropdown).toBeVisible();
    // nothing should be selected
    expect(screen.queryByText('Paspoort aanvraag')).not.toBeInTheDocument();
    expect(screen.queryByText('Rijbewijs aanvraag (Drivers license)')).not.toBeInTheDocument();
    expect(screen.queryByText('Not available with drivers license')).not.toBeInTheDocument();

    // now open the dropdown and select a product
    await user.click(productDropdown);
    await user.keyboard('[ArrowDown]');
    const option = await screen.findByText('Paspoort aanvraag');
    expect(option).toBeVisible();
    await user.click(option);
    expect(screen.queryByText('Rijbewijs aanvraag (Drivers license)')).not.toBeInTheDocument();
    expect(screen.queryByText('Not available with drivers license')).not.toBeInTheDocument();
    expect(await screen.findByText('Paspoort aanvraag')).toBeVisible();
  });
});
