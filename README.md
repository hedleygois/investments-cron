# This repo is inteded to be just a synchronizer between Alpha Vantage and my Hasura deployed Postgres

# Technologies
* NodeJS/Express
* got - For better API calls since it can retry calls if they fail (which might happen with Alpha Vantage)
* date-fns - For dates handling
* fp-ts for functional programming support
* Jest



## Hot it works
* Just `npm run dev` and send simple get requests to /intraday/sync and it will synchronize some stocks from Alpha Vantage to Hasura(which is backed by GraphQL).

OBS: Looking at the commit history you might see a lot of commits trying to deploy it on Zeit and Heroku. I never used such platforms hence the big amount of commits just for it.
