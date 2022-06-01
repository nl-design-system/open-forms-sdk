import React from 'react';
import PropTypes from 'prop-types';

import {Literal, LiteralsProvider} from 'components/Literal';
import {Toolbar, ToolbarList} from 'components/Toolbar';
import Loader from 'components/Loader';
import LogoutButton from 'components/LogoutButton';
import {SUBMISSION_ALLOWED} from 'components/constants';

const ButtonsToolbar = ({literals, canSubmitStep, canSubmitForm, loginRequired, isAuthenticated, isLastStep, isCheckingLogic, onNavigatePrevPage, onFormSave, onLogout}) => {
  const showSubmitButton = !(canSubmitForm === SUBMISSION_ALLOWED.noWithoutOverview && isLastStep);

  return (
    <>
      <LiteralsProvider literals={literals}>
        <Toolbar modifiers={['mobile-reverse-order', 'bottom']}>
          {/*<ToolbarList>
            <Button
              variant="anchor"
              component="a"
              onClick={onNavigatePrevPage}
            ><Literal name="previousText"/></Button>
          </ToolbarList>*/}
          <ToolbarList>
            {
              showSubmitButton
              && (<button
                type="submit"
                name="next"
                disabled={!canSubmitStep}
                className={"denhaag-button denhaag-button--end-icon"}
              >
                {
                  isCheckingLogic
                    ? (<Loader modifiers={['centered', 'only-child', 'small']}/>)
                    : (<Literal name="nextText"/>)
                }
                <span className={"denhaag-button__icon"}>
                  <svg
                    aria-hidden="true"
                    className="denhaag-icon"
                    focusable="false"
                    height="1em"
                    viewBox="0 0 24 24"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.293 5.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L16.586 13H5a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                  </svg>
                </span>
              </button>)
            }
            <button
              type="button"
              className={"denhaag-button denhaag-button--primary-action"}
              name="save"
              onClick={onFormSave}
            ><Literal name="saveText"/></button>
          </ToolbarList>
        </Toolbar>
      </LiteralsProvider>
      {isAuthenticated ? <LogoutButton onLogout={onLogout}/> : null}
    </>
  );
};


ButtonsToolbar.propTypes = {
  literals: PropTypes.object,
  canSubmitStep: PropTypes.bool.isRequired,
  canSubmitForm: PropTypes.string.isRequired,
  isLastStep: PropTypes.bool.isRequired,
  loginRequired: PropTypes.bool.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  isCheckingLogic: PropTypes.bool.isRequired,
  onNavigatePrevPage: PropTypes.func.isRequired,
  onFormSave: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};


export default ButtonsToolbar;
