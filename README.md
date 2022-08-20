# sem6-postgres-master

## Purpose of this repo
This repo contains code for the main backend. This backend handles authentication, holds slave information (seperate parking backends individual to a single parking)

### Used technologies
1. Written in NodeJS
2. Authentication using jwt's access token and refresh token approach
3. PostgreSQL database
4. Prisma ORM for database operations
5. Payments handled by Stripe API
6. API based on Express.js framework

#### How to set up
1. Clone this repo
2. Localize the .env.example file
3. Create a .env file with the instructions given in the .env.example file
4. Make sure you have NodeJS installed
5. Inside the root folder type `npm i` to install the dependencies

#### How to get the stripe env variables and set up the parking information on the master server
1. Create the main stripe account - this will be used do connect accounts used by the clients
2. Localize the stripe publishable key and the stripe secret key
3. Go to the URL [link]([https://dashboard.stripe.com/webhooks]) and generate a stripe webhook
4. Go to the URL [link (test mode)]([https://dashboard.stripe.com/test/connect/accounts/overview]) to create a new connected account used by the parking owner
5. Send the link to the owner to fill the details
6. Obtain the stripe account id of the created parking owner stripe account
7. Fill the env variables
8. Add a record with the parking information using the [Cieciex CMS]([https://cieciex.netlify.app/]), logged in as the admin of the system

#### How does the payment process work
<div style="display: flex;justify-content: center"><img style="width: 500px" src="https://b.stripecdn.com/docs-statics-srv/assets/application_fee_amount.837aa2339469b3c1a4319672971c1367.svg" alt="Funds flow"/>
</div>

This presents the flow of the funds.
The application fee is calculated using this formula:

apllication_fee = total * 0.05 + stripe_fee

The stripe fee is 1 PLN + 1.4% of the total value of the transaction

So the system owner gets 5% of every transaction made on the connected parkings.

#### Launch scripts
1. `npm run swagger` - used for generating the documentation file
2. `npm run dev` - used for local development
3. `npm run build` - used for generating the prisma client based on the prisma schema file
4. `npm run start` - used for local development but without hot reload on changes

### Deployment
1. There is a Procfile that is configured to host this project on heroku

Deployed on Heroku - [link1]([(https://sem6-postgres-slave1.herokuapp.com/)]) [link2]([(https://sem6-postgres-slave2.herokuapp.com/)])

Endpoint documentation [link]([https://sem6-postgres-slave1.herokuapp.com/docs/])

The routes in this project start with an prefix `/api/v1/`

For example to create a reservation on the first parking you have to send a POST request to the following URL: 
https://sem6-postgres-slave1.herokuapp.com/api/v1/reservations
