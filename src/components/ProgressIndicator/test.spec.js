import messagesNL from 'i18n/compiled/nl.json';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {IntlProvider} from 'react-intl';
import {MemoryRouter} from 'react-router-dom';

import {SUBMISSION_ALLOWED} from 'components/constants';
import {IsFormDesigner} from 'headers';

import ProgressIndicator from './index';

jest.mock('headers');

let container = null;
let root = null;
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  // cleanup on exiting
  root.unmount();
  container.remove();
  root = null;
  container = null;
});

const submissionDefaults = {
  id: 'some-id',
  url: 'https://some-url',
  form: 'https://some-form',
  steps: [],
  payment: {
    isRequired: false,
    amount: '',
    hasPaid: false,
  },
};

it('Progress Indicator submission allowed', () => {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/']}>
        <IntlProvider locale="nl" messages={messagesNL}>
          <ProgressIndicator
            title="Test Name"
            steps={[]}
            submission={{...submissionDefaults, submissionAllowed: SUBMISSION_ALLOWED.yes}}
            submissionAllowed={SUBMISSION_ALLOWED.yes}
          />
        </IntlProvider>
      </MemoryRouter>
    );
  });

  const progressIndicatorSteps = container.getElementsByTagName('ol')[0];
  expect(progressIndicatorSteps.textContent).toContain('Startpagina');
  expect(progressIndicatorSteps.textContent).toContain('Overzicht');
  expect(progressIndicatorSteps.textContent).toContain('Bevestiging');
});

it('Progress Indicator submission not allowed, with overview page', () => {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/']}>
        <IntlProvider locale="nl" messages={messagesNL}>
          <ProgressIndicator
            title="Test Name"
            steps={[]}
            submission={{
              ...submissionDefaults,
              submissionAllowed: SUBMISSION_ALLOWED.noWithOverview,
            }}
            submissionAllowed={SUBMISSION_ALLOWED.noWithOverview}
          />
        </IntlProvider>
      </MemoryRouter>
    );
  });

  const progressIndicatorSteps = container.getElementsByTagName('ol')[0];
  expect(progressIndicatorSteps.textContent).toContain('Startpagina');
  expect(progressIndicatorSteps.textContent).toContain('Overzicht');
  expect(progressIndicatorSteps.textContent).not.toContain('Bevestiging');
});

it('Progress Indicator submission not allowed, without overview page', () => {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/']}>
        <IntlProvider locale="nl" messages={messagesNL}>
          <ProgressIndicator
            title="Test Name"
            steps={[]}
            submission={{
              ...submissionDefaults,
              submissionAllowed: SUBMISSION_ALLOWED.noWithoutOverview,
            }}
            submissionAllowed={SUBMISSION_ALLOWED.noWithoutOverview}
          />
        </IntlProvider>
      </MemoryRouter>
    );
  });

  const progressIndicatorSteps = container.getElementsByTagName('ol')[0];
  expect(progressIndicatorSteps.textContent).toContain('Startpagina');
  expect(progressIndicatorSteps.textContent).not.toContain('Overzicht');
  expect(progressIndicatorSteps.textContent).not.toContain('Bevestiging');
});

it('Form landing page, no submission present in session', () => {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/']}>
        <IntlProvider locale="nl" messages={messagesNL}>
          <ProgressIndicator
            title="Test Name"
            steps={[]}
            submission={null}
            submissionAllowed={SUBMISSION_ALLOWED.yes}
          />
        </IntlProvider>
      </MemoryRouter>
    );
  });

  const progressIndicatorSteps = container.getElementsByTagName('ol')[0];
  expect(progressIndicatorSteps.textContent).toContain('Startpagina');
  expect(progressIndicatorSteps.textContent).toContain('Overzicht');
  expect(progressIndicatorSteps.textContent).toContain('Bevestiging');
});

it('Progress indicator does NOT let you navigate between steps if you are NOT a form designer', () => {
  const steps = [
    {
      slug: 'step-1',
      formDefinition: 'Step 1',
      index: 0,
      isApplicable: true,
      url: 'http://test.nl/api/v1/forms/111/steps/111',
      uuid: '111',
      completed: true,
    },
    {
      slug: 'step-2',
      formDefinition: 'Step 2',
      index: 1,
      isApplicable: true,
      url: 'http://test.nl/api/v1/forms/111/steps/222',
      uuid: '222',
      completed: false,
    },
    {
      slug: 'step-3',
      formDefinition: 'Step 3',
      index: 2,
      isApplicable: true,
      url: 'http://test.nl/api/v1/forms/111/steps/333',
      uuid: '333',
      completed: false,
    },
  ];

  IsFormDesigner.getValue.mockReturnValue(false);

  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/stap/step-2']}>
        <IntlProvider locale="nl" messages={messagesNL}>
          <ProgressIndicator
            title="Test Name"
            steps={steps}
            submission={{
              ...submissionDefaults,
              submissionAllowed: SUBMISSION_ALLOWED.yes,
              steps: steps,
            }}
            submissionAllowed={SUBMISSION_ALLOWED.yes}
          />
        </IntlProvider>
      </MemoryRouter>
    );
  });

  const step1 = container.getElementsByTagName('li')[1]; // Item 0 is the 'inloggen' step
  const step3 = container.getElementsByTagName('li')[3];

  const link = step1.getElementsByTagName('a')[0];
  const disabledLink = step3.getElementsByTagName('span')[0];

  expect(link).not.toBeUndefined();
  expect(disabledLink).not.toBeUndefined();

  expect(link.textContent).toContain('Step 1');
  expect(disabledLink.textContent).toContain('Step 3');
});

it('Progress indicator DOES let you navigate between steps if you ARE a form designer', () => {
  const steps = [
    {
      slug: 'step-1',
      formDefinition: 'Step 1',
      index: 0,
      isApplicable: true,
      url: 'http://test.nl/api/v1/forms/111/steps/111',
      uuid: '111',
      completed: true,
    },
    {
      slug: 'step-2',
      formDefinition: 'Step 2',
      index: 1,
      isApplicable: true,
      url: 'http://test.nl/api/v1/forms/111/steps/222',
      uuid: '222',
      completed: false,
    },
    {
      slug: 'step-3',
      formDefinition: 'Step 3',
      index: 2,
      isApplicable: true,
      url: 'http://test.nl/api/v1/forms/111/steps/333',
      uuid: '333',
      completed: false,
    },
  ];

  IsFormDesigner.getValue.mockReturnValue(true);

  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/stap/step-2']}>
        <IntlProvider locale="nl" messages={messagesNL}>
          <ProgressIndicator
            title="Test Name"
            steps={steps}
            submission={{
              ...submissionDefaults,
              submissionAllowed: SUBMISSION_ALLOWED.yes,
              steps: steps,
            }}
            submissionAllowed={SUBMISSION_ALLOWED.yes}
          />
        </IntlProvider>
      </MemoryRouter>
    );
  });

  const step1 = container.getElementsByTagName('li')[1]; // Item 0 is the 'inloggen' step
  const step3 = container.getElementsByTagName('li')[3];

  const link1 = step1.getElementsByTagName('a')[0];
  const link2 = step3.getElementsByTagName('a')[0];

  expect(link1).not.toBeUndefined();
  expect(link2).not.toBeUndefined();

  expect(link1.textContent).toContain('Step 1');
  expect(link2.textContent).toContain('Step 3');
});

it('Progress indicator DOES let you navigate between steps if you are NOT a form designer but a step is NOT applicable', () => {
  const steps = [
    {
      slug: 'step-1',
      formDefinition: 'Step 1',
      index: 0,
      isApplicable: true,
      url: 'http://test.nl/api/v1/forms/111/steps/111',
      uuid: '111',
      completed: true,
    },
    {
      slug: 'step-2',
      formDefinition: 'Step 2',
      index: 1,
      isApplicable: false,
      url: 'http://test.nl/api/v1/forms/111/steps/222',
      uuid: '222',
      completed: false,
    },
    {
      slug: 'step-3',
      formDefinition: 'Step 3',
      index: 2,
      isApplicable: true,
      url: 'http://test.nl/api/v1/forms/111/steps/333',
      uuid: '333',
      completed: false,
    },
  ];

  IsFormDesigner.getValue.mockReturnValue(false);

  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/stap/step-1']}>
        <IntlProvider locale="nl" messages={messagesNL}>
          <ProgressIndicator
            title="Test Name"
            steps={steps}
            submission={{
              ...submissionDefaults,
              submissionAllowed: SUBMISSION_ALLOWED.yes,
              steps: steps,
            }}
            submissionAllowed={SUBMISSION_ALLOWED.yes}
          />
        </IntlProvider>
      </MemoryRouter>
    );
  });

  const step3 = container.getElementsByTagName('li')[3];

  const link = step3.getElementsByTagName('a')[0];

  expect(link).not.toBeUndefined();
  expect(link.textContent).toContain('Step 3');
});

it('Progress indicator does NOT let you navigate to the overview if a step is blocked', () => {
  const steps = [
    {
      slug: 'step-1',
      formDefinition: 'Step 1',
      index: 0,
      isApplicable: true,
      url: 'http://test.nl/api/v1/forms/111/steps/111',
      uuid: '111',
      completed: true,
      canSubmit: false,
    },
  ];

  IsFormDesigner.getValue.mockReturnValue(false);

  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/stap/step-1']}>
        <IntlProvider locale="nl" messages={messagesNL}>
          <ProgressIndicator
            title="Test Name"
            steps={steps}
            submission={{
              ...submissionDefaults,
              submissionAllowed: SUBMISSION_ALLOWED.yes,
              steps: steps,
            }}
            submissionAllowed={SUBMISSION_ALLOWED.yes}
          />
        </IntlProvider>
      </MemoryRouter>
    );
  });

  const overview = container.getElementsByTagName('li')[2];

  const overviewLink = overview.getElementsByTagName('a')[0];
  const overviewSpan = overview.getElementsByTagName('span')[0];

  // Check that the overview is not a link since a step cannot be submitted
  expect(overviewLink).toBeUndefined();
  expect(overviewSpan).not.toBeUndefined();
  expect(overviewSpan.textContent).toContain('Overzicht');
});
