The zotheka-web folder is from another codebase and it has a repo so you can as well change the repo to the current.
Also I want us to change the look of the website in that folder to have the following funtionality.

## Main goal
- We have noticed malawians prefer sharing the cost of the spotify accounts. So we decided to create this zothekaV2 with that simplicity.
- For this, there is no mentioning of USD, no creating a wallet for the user etc.
- Its just plain and simple, pay for spotify with Malawian Kwacha.( with peers or solo)

## The flow
1. User signs up
2. They see a home page that asks to pay for spotify and they get to choose between
    a. Paying for it solo
    b. Paying for it with a friend 
    c. Paying for it with many friends ( i.e family )

3.  The initiator fills the following details:-
    - The spotify login ccount details ( i.e spotify email and spotify password)
    - The people they are aying with (this is mostly according to the accounts that can be added e.g duo needs 2 , family may be 6). So this is gonna be a number.
    - The amount is then split into the amount of people the initiator has decided to have on the spotify (i.e if the user chooses duo, the amount is split into 2, if family, split into 6 etc.), then the user makes the payment. After they make the payment, they receive a purchase invite link strictly for joining the purchase (no referral attached).
    - The initiator now shares this purchase invite link with their friends.

## Referrals
- Separately, every user has a unique referral code attached to their account.
- They can share their referral link in the format: `applink/signin/VHJDGA`.
- When an invitee uses this link, they are taken to the sign-in page. 
- If they sign up and are not in our database, we link them to their referrer and then generate their own unique referral link.

4.  The friends now click on the link and it opens a page with a friendly text that (initiator Name) requests that they get to be in one package or help in the payment of a duo account etc. The friend can agree to proceed or deny. The proceed will take them to signing up page.
- After our friend has signed up, we check for the KYC ststus, if they havent we direct them to the account page to do the KYC. Once they have done, they come back to the same page they were on. Then they can pay for their part of the package.

5. After everyone has made the payment, we can see on our backend and we can pay for the spotify account details and tell that the order is now completed. 

## Changes 
- Our new backend logic is now attached in app.py in this codebase. (it also has our exposed endppints.)
- We are not gonna use privy so we will use the normal sign up with google and continue with email in a custom way.
- We are still using elementpay to get MWK and settle USDC to our treasury address.

    