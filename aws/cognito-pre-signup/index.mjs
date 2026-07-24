export const handler = async (event) => {
  if (event.triggerSource === 'PreSignUp_SignUp') {
    event.response.autoConfirmUser = true;
    if (event.request.userAttributes.email) {
      event.response.autoVerifyEmail = true;
    }
  }

  return event;
};
