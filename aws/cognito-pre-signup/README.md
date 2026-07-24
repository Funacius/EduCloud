# EduCloud Cognito pre-sign-up trigger

This Lambda trigger automatically confirms and email-verifies self-service
registrations made by the EduCloud Cognito app client. Cognito therefore does
not send a sign-up confirmation code, while the verified email remains
available for the Forgot Password recovery flow.

Attach `index.mjs` to the Singapore user pool as the **Pre sign-up** trigger.
The function does not auto-confirm `AdminCreateUser` accounts; provisioned
accounts must continue to set `email_verified=true` and use
`MessageAction=SUPPRESS`.
