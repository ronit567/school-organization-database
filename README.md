# School Organization Database - Setup Instructions

> **Prerequisites:** You’ll need [Node.js](https://nodejs.org/en/) and [PostgreSQL](https://www.postgresql.org/download/) installed on your system before continuing.

To get started, clone the repository and navigate into the project directory: `git clone https://github.com/ronit567/school-organization-database.git` then `cd school-organization-database`.

Install all dependencies with `npm install`.

Create a `.env` file in the root directory with the following content:  
`DB_HOST=localhost`  
`DB_USER=your_postgres_username`  
`DB_PASSWORD=your_postgres_password`  
`DB_NAME=school_org_db`  
`DB_PORT=5432`  
`PORT=3000`

Set up your PostgreSQL database. Make sure PostgreSQL is running, then create a new database with `CREATE DATABASE school_org_db;`. If your project includes a `schema.sql` or similar file, initialize the database tables with `psql -U your_postgres_username -d school_org_db -f schema.sql`.

Start the development server using `npm run dev`. After a few seconds, the app should be accessible at [http://localhost:3000](http://localhost:3000).

To build the project for production, run `npm run build`.

If you encounter issues: verify your `.env` values and ensure PostgreSQL is running if there is a database connection error, change the `PORT` in `.env` if the port is already in use, and run `npm install` again if modules are missing.
