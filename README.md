# Serenity to Topcoder Challenge Listing Integration
This deliverable, hereafter named serenity-list, is a simple nodeJS application that returns listing of all active challenges in Serenity and transform the data a little bit so it can be used by the existing Topcoder site.

Serenity-list is written with NodeJS. This application is part of Project SERENITY, a refresh of the topcoder challenge lifecycle. The details of the challenge can be found [here](http://www.topcoder.com/challenge-details/30046414/?type=develop)

# Quickstart
To use this application, follow these steps:

1. This requires you to have installed nodeJS and npm previously.
2. Unzip the project file.
3. Open the terminal and cd into the project directory. `cd YOUR_UNZIPPED_PATH/serenity-list`.
4. Run `npm install` to install any dependencies required by this application.
5. Edit `serenity-list/config.js` as needed, maybe changing the port this app will listen to.
6. Run `node app` to start the application. If it's succesful, the terminal will display `Listening on port x` where x is the port number.

# Testing
To test this application, send GET request to `http://localhost:12345/getActiveChallenges`. It can be as simple as accessing with your favorite browser. You can also use Postman plugin to make it pretty and easy to look at.

# Code Walkthrough
Since this application is advised to use sequelize just like in serenity-core. Some files, all in Challenge Package, are initially copied over from serenity-core. Those files are:

* `controllers/challenges.js`. All functions except `.all` are removed. `.all` is renamed into `.allActiveChallenges` to better reflect its new function. The query result is not returned directly, it is converted first into the format that can be used by the existing Topcoder site.
* `lib/routeHelper.js`. Unchanged.
* `models/challenge-registrant.js`. Add `belongsTo` association with Challenge model.
* `models/challenges.js`. Add `hasMany` association with ChallengeRegistrant model.
* `models/index.js`. Unchanged.
* `datasource.js`. Unchanged.

These are the other untracked files and a short of explanation of what are they used for:

* `format/challenge-tc-format.js`. This module contains the logic to convert Serenity Challenge data into the format used by the existing Topcoder site. Please see [here](https://github.com/topcoderinc/serenity-core/issues/46) to check the mapping table.
* `app.js`. This module is the entry-point for serenity-list. It initializes datasource in `datasource.js`, defines the route, and initiates listening to the port for incoming request.
* `config.js`. This is the configuration file. The database configuration is copied from serenity-core `config/env/development.js`. There is also port number if you want to change it.
* `package.json`. What's important here is the list of dependencies. The version number is made similiar with what exists in serenity-core.
* `README.md`.

# Traceability List
These are the requirements listed by the challenge:

1. `Create a node app with single service with an endpoint called /getActiveChallenges that only get challenges whos status is NOT draft or complete.`
The route can be found in `app.js`. The query condition can be found in `controllers/challenges.js`.
2. `You should may use serenity-core1 repo which has the config file (development) that will connect you to our sample databases.`
The database configuration can be found in `config.js`.
3. `You should use sequelize like in this repo but not all the mean stuff,  Should be very small app no overhead.`
For sequelize, `controllers/challenges.js`, `models`, and `datasource.js` are copied from serenity-core. The model and the controller are changed a bit to fulfill the requirements and some unnecessary parts unused in serenity-list are removed.
4. `tc stores dates in EST and lc stores in UTC so we must subtract 4 hours from all our timesstamps.`
Date conversion can be found in `format/challenges-tc-format.js`.
5. `Create a urlPrefix variable in the config file with the value equal to 'http://serenity-core1.herokuapp.com/#!/challenges/'`
The variable can be found in `config.js`.
6. `Any property with NOTES = DONT RETURN do no return (see mapping table)`
See `format/challenges-tc-format.js` to check if it's correct.
7. `For  'numRegistrants' you will need to resolve the count from the Registrants table (see mapping table).  You can do this by do a db call (via sequlize) and passing in the challenge id, or but setting up the relationship via the model (see how files and attachments are done, this is perfered if possible)`
See `format/challenges-tc-format.js` to check if it's correct. Serenity-list uses `sets up the relationship via the model` method.
8. `Look at issue #46 ( https://github.com/topcoderinc/serenity-core/issues/46 ) for the mapping table.`
See `format/challenges-tc-format.js`and the link to check if it's correct.

# Node Modules
* ExpressJS
* SequelizeJS
* pg
* fs-extra
* lodash

# Youtube Links
[http://youtu.be/71gOH8LDPVs](http://youtu.be/71gOH8LDPVs)
