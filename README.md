# Mapas Coletivos API Service

A colaboration platform for maps.

## Getting started

To set up a development environment install the following on your system:

* [Git](https://help.github.com/articles/set-up-git)
* [nvm](https://github.com/creationix/nvm) or Node.js version available at [.nvmrc](.nvmrc)
* [Docker](https://www.docker.com/)

Clone this repository locally and activate target Node.js version:

```
nvm install
```

Install Node.js dependencies:

```
npm install
```

### Development

Init development database:

    npm run start-dev-db

In another terminal, start development server that listen to code changes:

    npm run dev

Create a admin user at [localhost:3000](http://localhost:3000).

### Testing

Start test database:

    npm run start-test-db

In another terminal, run tests:

    npm run test

## Configure

Access the administrative area at [http://localhost:3000/admin](http://localhost:3000/admin). After creating an user with administrative role, you will be presented to the sections described bellow:

1. **General settings:**
  - Setup site title and description, which will be exposed to the client via API.
  - Client and Server URLs, which are useful to generate links for email tokens;
  - Enable/disable user registration, if you want to restrict the platform only to invited users;
  - Enable/disable file import to create layer (CSV, KMLs, GeoJSON, etc);
1. **Mailer settings:**
  - User registration need e-mail confirmation, so you have to setup a SMTP server. At this area you can setup your SMTP host, username and password;
1. **Users invitation:**
  - You can invite new users to the plataform by providing their email, name and role;
1. **Manage roles, which can be:**
  - **Collaborator**: can create features and contents;
  - **Editor**: same as collaborator, plus can create new layers and maps;
  - **Admin**: same as editor, plus access to admin area.

## Developement

Write tests and run `npm test`.

## License

[MIT](LICENSE)
