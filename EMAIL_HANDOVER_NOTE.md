# GreenFibre — Email account handover note

**Date:** 17 Aug 2026  
**Contains:** account/service names only — **no passwords**

## Email systems used by the application

| Service | Purpose | Env vars (names only) | Transfer needed? |
|---------|---------|------------------------|------------------|
| Gmail via Nodemailer | OTP, password reset, order/contact emails | `USER_EMAIL`, `USER_PASS` | YES |
| Company contact address | Invoices / public contact display | `COMPANY_EMAIL` | YES (confirm ownership) |

## Client-requested mailboxes

The client requested access related to:

1. **GreenFibre** email account(s) used by the live site/API  
2. **Ganpati** email account(s) (business / related mailbox — confirm with owner which address(es))

## What to transfer (securely, outside GitHub)

- Mailbox login ownership / recovery contacts  
- Gmail **App Password** (or SMTP credentials) used by the backend  
- Any forwarding rules, DNS MX / SPF / DKIM ownership notes  
- Which address is set as `USER_EMAIL` in production  
- Which address is set as `COMPANY_EMAIL`

## What NOT to do

- Do not put email passwords in GitHub  
- Do not put email passwords in README or `.env.example`  
- Do not commit production `.env`  
- Do not paste app passwords into public tickets  

## Suggested handover steps

1. Confirm the exact GreenFibre and Ganpati addresses with the current owner.  
2. Transfer Google account ownership / add client as owner, **or** create a new shared mailbox and update production `USER_EMAIL` / `USER_PASS`.  
3. Rotate the Gmail app password after transfer.  
4. Send the new app password only through a password manager.  
5. Send a test OTP / contact form email to verify.
