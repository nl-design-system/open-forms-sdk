import {
  FormFieldDescription,
  Paragraph,
  Textbox,
  FormField as UtrechtFormField,
} from '@utrecht/component-library-react';
import {Field, useFormikContext} from 'formik';
import PropTypes from 'prop-types';
import React from 'react';

import {Label} from 'components/forms';

export const TextField = ({
  name,
  label = '',
  isRequired = false,
  description = '',
  id = '',
  disabled = false,
  ...inputProps
}) => {
  const {getFieldMeta} = useFormikContext();
  const {error} = getFieldMeta(name);
  const invalid = !!error;
  return (
    <UtrechtFormField type="text" invalid={invalid} className="utrecht-form-field--openforms">
      <Label id={id} isRequired={isRequired} disabled={disabled}>
        {label}
      </Label>
      <Paragraph>
        <Field
          name={name}
          as={Textbox}
          id={id}
          className="utrecht-textbox--openforms"
          disabled={disabled}
          invalid={invalid}
          {...inputProps}
        />
      </Paragraph>
      {description && <FormFieldDescription>{description}</FormFieldDescription>}
      {invalid && (
        <FormFieldDescription invalid className="utrecht-form-field-description--openforms-errors">
          {error}
        </FormFieldDescription>
      )}
    </UtrechtFormField>
  );
};

TextField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  isRequired: PropTypes.bool,
  description: PropTypes.string,
  id: PropTypes.string,
  disabled: PropTypes.bool,
};

export default TextField;
