[1. Stack and structure](#1-stack-and-structure)

[2. Getting started](#2-getting-started)

[3. Development](#3-development)

[4. Overview](#4-overview)


# 1. Stack and structure
### Stack
```
                          _______             --------------------
                          |     | html/css/js |      React       |
                          |     | <---------- | (nodeJS process) |
                          |     |             --------------------
                          |  E  |                      
 ------------------       |  X  |                      
 |     Redux      |  <--  |  P  |                                       Knex        ______
 | (client state) |  -->  |  R  |              --------------------   (Bookshelf)  /      \
 ------------------       |  E  | <----------- |       API        | ------------> /   Db   \
/__________________\      |  S  | -----------> | (nodeJS process) | <------------ \  MySQL /
                          |  S  |              --------------------       JSON     \______/
                          |(req,|                                                               <------
                          | res)|                                                                      \
                          |     |                                                                       \
                          |_____|                                                                        \________
USER PORTAL                                                                                              /        \
=================================================================================================       / Firebase \
WEB APP (TOOL)                                                                                          \          /
                                                                                                         \________/
                                                                                                         /
                                                                                                        /
                                                                                                       /
                                                                                                 <-----
```
- Development server: Webpack.

Advise for future stack changes:
- Use Typescript for React to prevent coding errors.
- Replace Redux and Knex with JS Framework Apollo (part of Next.js). Removes a lot of "plumbing-code" and makes it much more manageable, lean, moveable between coders, etc. It replaces routes with your folder structure. Authorisation uses NextAuth.
- Replace JSON with GraphQL (also part of Apollo framework)


### Folder structure
- There is a distinction between Changeroo/portal and Changeroo/web-app. This repository contains the Changeroo/portal. <br> However, Changeroo/web-app also uses this repository for any server side code that it needs, including:
    - `./controllers/APIController.js`
    - `./controllers/firebaseController.js` (used by both portal and tool)
    - `./helpers/tocExport.js`, `./helpers/hashing.js`, `./helpers/dateHelper.js`, `./helpers/throwAPIError.js` and `./helpers/getIdFromToken.js`
    - `./backup.js`, which makes backups of the firebase database.
    - `./cli.js`, which is used a.o. to load Academy posts, send emails and to synchronize ToC projects, super admins and permissions (as part of project) with Firebase.
- The root folder of this repository contains all server side code.
- Subfolder "changeroo/client/client" contains all client side code. This is set up as a seperate repository. It can also be run locally for testing purposes, independently from the server side code.
- Other content in "changeroo/client" is used only to host the client side interface locally for testing purposes (on http://localhost:8888). This content therefore is not meant for the production server.



# 2. Getting started
### Run
```
1. nodemon -L server.js
If you also want to run the client side:
2. cd ./changeroo-portal/client
   npm start
```

### Run on Cloud 9
To run it locally in Cloud9, the Cloud9 application/Workspace needs to be set to public within Cloud9 (only Cloud9 admin can do this) or otherwise you will get a CORS error.
```
Terminal 1: mysql-ctl stop && mysql-ctl start && npm run dev
Terminal 2: cd ./changeroo-portal/client
            npm start
Open https://changeroo-portal-mhklein.c9users.io
```

### Restarting pm2 on production server
`/usr/local/etc/rc.d/pm2_techwolf12 stop ; /usr/local/etc/rc.d/pm2_techwolf12 start`

### Configuration
```
1a. Copy variables.env.sample to variables.env
1b. Fill in environment variables
    Note, environment variables at the client side need to be defined in a seperate file:
1c. Copy client/.env.sample to client/.env
1d. Fill in environment variables for the client side

2a. Create a Firebase project on https://console.firebase.google.com/u/0/?pli=1
2b. Create a key on: Settings > Service accounts > "Generate new private key". This generates a JSON structured data file.
2c. Place the contents of this file in the project root and name it ```serviceAccountKey.json```

3.  For configuration of the client side, please refer to the Readme file in the folder ./changeroo-portal/client.
```

### Installation
```
0. install MySQL 5, NodeJS
1. Install nodemon: sudo npm install -g nodemon
2a. yarn install  (depending on whether you want to use yarn or npm)
2b. npm install | npm update
3. npm run rollback
4. npm run migrate
5. npm run seed
6. npm run webpack-once
```



# 3. Development
### Work to be done to migrate to React and implement the new design
- **TODO**: Client: The clients/components folder should be split up in components, layouts and pages.
- **TODO**: Client: Improve the implementation of Redux. All data operations in components and their relevant calls to the API should be placed in seperate actions. Reducer from client/store.js should be moved to seperate files and combined using https://redux.js.org/api/combinereducers
- **TODO**: Client: Handle errors by giving users feedback and not just write the error to console.log.
- **TODO**: Client: Also check "Roadmap to complete the new design in React" in the Readme file in the client folder.
- **TODO**: Server: Remove password hash from API responses of user object.
- **TODO**: Server controllers: Initially React wasn't used and we are now recoding everything to React. In the controllers folders, a selection of controllers were copied to `v2Controllers.js` and recoded for React accordingly. Old controllers should be deleted and this file should be split up again in seperate controllers. Old controllers are in subfolder ./controllers/old.<br>
            The controllers already converted to React: Stakeholder, ToC, Organisation, Payment, and 1 method from tocAcademyController.
- **TODO**: Below is a list of files that we expect can be deleted once we've finished the migration to React and the new design:
    - ./views/ folder, except probably the mailers, which will still use pug?
    - `app.js`: remove pug once we don't need it anymore.
    - /public/sass/ can be removed except if in the mailers css is being used. Also check if pdf generation of invoices uses pug and css.
    - /public/js/index.js
    - public/img logo and logo-small
    - public/img/404/
    - public/dist/
    - public/js

### Adding routes at the client side
To create a route at the client-side, the name of the route should be defined inside of `./changeroo-portal/client/client/config.js` on **line 22**.<br>
Then look for the file `./changeroo-portal/client/client/components/Base.js`. On **line 157** you will find the start of the page definitions. Add your own path and component to create new pages.
**TODO**: See config.js TODO's that this needs to be corrected, and should not work the way as described here. Once done, the text here in the Readme file can be deleted.

### Module updates
To check for module update (also in client subfolder) you can use: `npm-check` (and you can of course use `npm audit` and `npm outdated`).

### Testing
We use mocha and chai for testing.

### Testing cron jobs
```node cli.js se``` or ```node cli.js send-emails``` or visit `url/mails/test/` which will automatically process the cron job.
- Make sure that the users that you don't want to send an email to are de-activated (if it works correctly, de-activated users are not sent any emails).
- Emails are sent through Sendgrid. However, if this is set up correctly, Sendgrid goes into Sandbox modus when you run the cron job from a non-production server.



# 4. Overview
### User rights
https://docs.google.com/document/d/1e07kTOYWMztFmnlZo7kU-3reasIgpq_lKZsOXt3jh28/

### Pages and their states
**Page**            | **State**                                 | **Description**                               | **New design implemented?**
------------------- |------------------------------------------ |-----------------------------------------------|--------------------------
/                   |                                           |                                               | 
/pricing            | tab: show, buy                            | Show overview and <br> purchase a plan        | 
/partnerships       |                                           |                                               | 
/privacy            |                                           |                                               | 
/terms              |                                           |                                               | 
/404                |                                           |                                               | 
/contact            |                                           |                                               | 
/support-form       |                                           |                                               | 
/feedback, done, success | message: <label> **TODO**: Not sure how this is used... | Displays server redirect message | 
/signup             |                                           |                                               | 
/login              |                                           |                                               | 
/forgot-password    |                                           |                                               | 
/new-password       | user: <id>                                | Change new password                           | 
/toc-academy        |                                           | Blog posts from WP <br> Filter, sort, search  | 
/support            |                                           | Render all support organisations              | 
/profile            | user: <id>                                | Show specific user                            | 
/experts            |                                           | Show all experts, links to /profile           | 
/tocs               | user: <user>                              | All ToCs of specific user                     | 
/toc                | tab: show, users, advanced <br> id: <toc> | Show specific ToC                             | 
/move-toc           | **TODO**                                  |                                               | 
/public-tocs        | id: <id>                                  | Show all or a specific toc                    | 
/organisations      | user: <user>                              | List organisations of user                    | 
/organisation       | tab: show, users, tocs, transactions, subscription <br> id: <organisation> | Show specific organisation | 
/admin              | tab: users, tocs, organisations, transactions, coupons, plans, support     | Super admin table view     | 

### State attributes
**State attribute** | **Example**               | **Relevant pages**
------------------- |-------------------------- |------------------------------
page                | landing                   | *
modal               | create-coupon             | *
id                  | 0e1f3b5-8c74-442d         | /public-tocs, /toc, /organisation, /toc-academy
tab                 | show                      | /pricing, /admin, /organisation, /toc
user                | martin                    | /organisations, /tocs, /profile
search              | My dream                  | /tocs, /experts, /toc-academy
action              | duplicate                 | /modal
topic               | ToC general               | /toc-academy
language            | nl                        | /toc-academy
message             | user_not_found            | /feedback
status              | active                    | /tocs
sort                | last_edited               | /tocs

### Modals
**Modal**                       | **State**
------------------------------- |----------------------------
/modal/admin-update             |
/modal/create-toc               |
/modal/toc-invite               |
/modal/organisation-invite      |
/modal/update-toc               | action: create, duplicate, delete, archive, move
/modal/request-toc-role         |

### Plugins
<table>
    <tr>
        <td>
            <b>input</b>
            <ul>
                <li>textarea</li>
                <li>select</li>
                <li>checkbox</li>
                <li>input</li>
                <li>**TODO**: date field, or is that the same as input?</li>
            </ul>
            </br>
            <b>tooltip</b>
            <ul>
                <li>menu</li>
                <li>message</li>
            </ul>
            </br>
            <b>button</b>
            <ul>
                <li>card-primary</li>
                <li>card-secondary</li>
            </ul>
        </td>
        <td>
            <b>upload</b>
            <ul>
                <li>user</li>
                <li>toc</li>
                <li>organisation</li>
            </ul>
            </br>
            <b>notification</b>
            <ul>
                <li>error</li>
                <li>success</li>
                <li>info</li>
            </ul>
            </br>
            <b>modal</b>
            <p><b>slider</b></p>
        </td>
    </tr>
</table>

### Data model
- stakeholders / users (we call users stakeholders)
- organisations (has 1 or more users)
- tocs (has 1 or more users)
- organisation_members (with user roles in an organisation; with token and expiration date for the activation link for a user role in the organisation)
- toc_members (same but for a user role in a ToC)
- support_organisations (simple profile of organisations who market their services on our website)
- plans (the different subscription plans available)
- coupons (discount coupons)
- transactions (stores the transactions for payment of subscription plan)
- sent_emails (??? probably for email cron job, to ensure it doesn't send the same email twice)
- posts (??? for posts via the contact form???; currently, I don't think posts are actually stored)
- wordpress_posts (ToC Academy posts are loaded from a JSON blob from a Wordpress website and stored in the mysql db)

**TODO:** A list of a selection of db adjustments that are yet to be implemented for the new design can be found at the end of the document here: https://docs.google.com/document/d/1e07kTOYWMztFmnlZo7kU-3reasIgpq_lKZsOXt3jh28/