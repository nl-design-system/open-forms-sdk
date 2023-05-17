import {
  FormFieldDescription,
  FormLabel,
  Paragraph,
  Textbox,
  FormField as UtrechtFormField,
} from '@utrecht/component-library-react';
import {useField} from 'formik';
import PropTypes from 'prop-types';
import React from 'react';
import {useIntl} from 'react-intl';
import {NumericFormat} from 'react-number-format';

import {getBEMClassName} from 'utils';

const NumberField = ({
  name,
  min,
  step,
  label = '',
  isRequired = false,
  description = '',
  id = '',
  disabled = false,
  invalid = false,
}) => {
  const [field, helpers] = useField(name);
  const {locale} = useIntl();

  const numberFormat = new Intl.NumberFormat(locale);
  const labelClassName = getBEMClassName('label', [isRequired && 'required'].filter(Boolean));
  const inputClassName = getBEMClassName('input', [invalid && 'invalid'].filter(Boolean));

  const allowNegative = min && min < 0;
  // We get the decimal separator by formatting a arbitrary number, and then extracting the decimal separator
  const decimalSeparator = numberFormat
    .formatToParts(1.1)
    .find(part => part.type === 'decimal').value;
  const thousandSeparator = decimalSeparator === ',' ? '.' : ',';
  const isAllowedToTypeDecimals = !step;

  const inputProps = {
    // To handle the State in formik
    // It is important to note that the onChange handler, **DOES NOT** handle any sanitization of the input.
    ...field,
    value: helpers.value,

    // These are passed down to the customInput
    id,
    className: inputClassName,
    disabled,
    invalid,
    min,
    step,
    type: 'text',

    // These are for the NumericFormat component
    customInput: Textbox,
    allowNegative,
    decimalSeparator,
    thousandSeparator,
    decimalScale: isAllowedToTypeDecimals ? 2 : 0,
  };

  return (
    <UtrechtFormField type="text" invalid={invalid.toString()}>
      <Paragraph className={labelClassName}>
        <FormLabel htmlFor={id}>{label}</FormLabel>
      </Paragraph>
      <Paragraph>
        <NumericFormat {...inputProps} />
      </Paragraph>
      {description && <FormFieldDescription invalid={invalid}>{description}</FormFieldDescription>}
    </UtrechtFormField>
  );
};

NumberField.propTypes = {
  name: PropTypes.string.isRequired,
  min: PropTypes.number,
  step: PropTypes.number,
  label: PropTypes.string,
  isRequired: PropTypes.bool,
  description: PropTypes.string,
  id: PropTypes.string,
  disabled: PropTypes.bool,
  invalid: PropTypes.bool,
};

export default NumberField;
