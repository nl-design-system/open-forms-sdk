import PropTypes from 'prop-types';
import {FormattedMessage, useIntl} from 'react-intl';

import {OFButton} from 'components/Button';
import {useAnalyticsToolsConfig} from 'components/analytics/AnalyticsToolConfigProvider';
import {buildGovMetricUrl} from 'components/analytics/utils';
import useFormContext from 'hooks/useFormContext';

const AbortButton = ({isAuthenticated, onDestroySession}) => {
  const intl = useIntl();
  const analyticsToolsConfig = useAnalyticsToolsConfig;
  const form = useFormContext();

  const confirmationMessage = isAuthenticated
    ? intl.formatMessage({
        description: 'log out confirmation prompt',
        defaultMessage: 'Are you sure that you want to logout?',
      })
    : intl.formatMessage({
        description: 'Cancel confirmation prompt',
        defaultMessage:
          'Are you sure that you want to cancel this submission? You will lose your progress if you continue.',
      });

  const callback = async event => {
    event.preventDefault();

    if (!window.confirm(confirmationMessage)) return;

    await onDestroySession();

    if (analyticsToolsConfig.enableGovmetricAnalytics) {
      const govmetricUrl = buildGovMetricUrl(
        analyticsToolsConfig.govmetricSourceIdFormAborted,
        form.slug,
        analyticsToolsConfig.govmetricSecureGuidFormAborted
      );

      window.open(govmetricUrl);
    }
  };

  const message = isAuthenticated ? (
    <FormattedMessage description="Log out button text" defaultMessage="Log out" />
  ) : (
    <FormattedMessage
      description="Button label to cancel submission"
      defaultMessage="Cancel submission"
    />
  );

  return (
    <OFButton appearance="primary-action-button" hint="danger" name="abort" onClick={callback}>
      {message}
    </OFButton>
  );
};

AbortButton.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  onDestroySession: PropTypes.func.isRequired,
};
export default AbortButton;
