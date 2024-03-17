// Import necessary modules
import express from "express"; // Import the Express framework
import bodyParser from "body-parser"; // Middleware for parsing request bodies
import pg from "pg"; // PostgreSQL client library
import bcrypt from "bcrypt"; // Library for hashing passwords
import passport from "passport"; // Authentication middleware for Node.js
import { Strategy } from "passport-local"; // Local authentication strategy for Passport
import session from "express-session"; // Middleware for managing sessions
import env from "dotenv"; // Module for loading environment variables

// Initialize Express application
const app = express();
const port = 3000; // Port on which the server will listen
const saltRounds = 10; // Number of salt rounds for password hashing
env.config(); // Load environment variables from .env file

// Configure session middleware
app.use(
  session({
    secret: "TOPSECRETWORD", // Secret used to sign the session ID cookie
    resave: false, // Do not save session if unmodified
    saveUninitialized: true, // Save new sessions
  })
);

// Parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files from the 'public' directory
app.use(express.static("public"));

// Initialize Passport and session middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect to PostgreSQL database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "website",
  password: "r13l2006",
  port: 5432,
});
db.connect();



// Route to render registration page
app.get("/", (req, res) => {
  res.render("register.ejs");
});

// Route to render login page
app.get("/loginn", (req, res) => {
  res.render("login.ejs");
});

// Route to redirect to home page
app.get("/login", (req, res) => {
  res.redirect("/");
});


// Route to render main page
app.get("/main", async (req, res) => {
  // Check if user is authenticated
  if (req.isAuthenticated()) {
    try {
      // Query organizations associated with current user
      const result = await db.query(`
        SELECT name FROM organizations WHERE user_id = $1
      `, [req.user.id]);

      // Extract organization names from query result
      const row = result.rows.map(row => row.name);

      // Query all organizations associated with current user
      const itemsResult = await db.query(`
        SELECT * FROM organizations WHERE user_id = $1
      `, [req.user.id]);
      const items = itemsResult.rows; // Extract organizations from query result
      console.log(items); 

      // Fetch school for the currently logged-in user
      const schoolResult = await db.query(`
        SELECT school FROM users WHERE id = $1
      `, [req.user.id]);
      const userSchool = schoolResult.rows[0].school; // Extract user school

      // Render main page with organization data and user school
      res.render("main.ejs", { 
        theitems: JSON.stringify(row), 
        listItems: items,
        userSchool: userSchool
      });
    } catch (err) {
      console.error("Error fetching data from the database:", err);
      res.status(500).send("Error fetching data from database");
    }
  } else {
    res.redirect("/"); // Redirect to home page if user is not authenticated
  }
});




// Route to handle organization registration
app.post("/addd", async (req, res) => {
  // Extract data from request body
  const organization = req.body.organization;
  const phone_number = req.body.number;
  const email = req.body.email;
  const description = req.body.description;
  const additionalinfo = req.body.additional;
  const user = req.user.id;

  try {
    // Insert organization data into the database
    await db.query(`
      INSERT INTO organizations (name, phone_number, email, description, additional_info, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [organization, phone_number, email, description, additionalinfo, user]);
    // Redirect to main page after successful insertion
    res.redirect("/main");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding organization");
  }
});


app.get("/edit", (req, res) => {
  res.render("edit.ejs");
});

app.post('/editt', async (req, res) => {
  try {
    const { organization, change, description } = req.body;

    // Check if 'change' is provided in the request body
    if (!change) {
      console.error('Change field is not provided in the request body');
      return res.status(400).send('Change field is required');
    }

    // Convert 'change' to lowercase for case-insensitive comparison
    const lowercaseChange = change.toLowerCase();

    // Map input to database column names
    let columnName;
    switch (lowercaseChange) {
      case "phone number":
        columnName = "phone_number";
        break;
      case "email":
      case "gmail":
        columnName = "email";
        break;
      case "name":
        columnName = "name";
        break;
      case "additional information":
        columnName = "additional_info";
        break;
      case "description":
        columnName = "description";
        break;
      default:
        // Handle unrecognized input here
        console.error('Invalid value for change:', change);
        return res.status(400).send('Invalid value for change');
    }

    // Build and execute the PostgreSQL query
    await db.query(`UPDATE organizations SET ${columnName} = $1 WHERE name = $2 AND user_id = $3`, [description, organization, req.user.id]);

    res.redirect('/main');
  } catch (error) {
    console.error('Error executing PostgreSQL query:', error);
    res.status(500).send('Error editing data');
  }
});

// Route to handle filtering organizations by phone number
app.post("/number", async (req, res) => {
  try {
    // Query organizations with non-null phone numbers belonging to the current user
    const result = await db.query(`
      SELECT * FROM organizations WHERE user_id = $1 AND phone_number IS NOT NULL AND phone_number != ''
    `, [req.user.id]);

    const schoolResult = await db.query(`
      SELECT school FROM users WHERE id = $1
    `, [req.user.id]);
    const userSchool = schoolResult.rows[0].school; 

    // Render main page with filtered organizations
    res.render("main.ejs", {  
      listItems: result.rows,
      userSchool: userSchool
    });
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    res.status(500).send("Error fetching data from database");
  }
});

// Route to handle filtering organizations by phone number
app.post("/additional", async (req, res) => {
  try {
    // Query organizations with non-null phone numbers
    const result = await db.query(`
    SELECT * FROM organizations
    WHERE user_id = $1 AND additional_info IS NOT NULL AND additional_info != ''
  `, [req.user.id]);

    const schoolResult = await db.query(`
    SELECT school FROM users WHERE id = $1
  `, [req.user.id]);
  const userSchool = schoolResult.rows[0].school; 
    // Render main page with filtered organizations
    res.render("main.ejs", {  
      listItems: result.rows,
      userSchool: userSchool
    });
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    res.status(500).send("Error fetching data from database");
  }
});

// Route to handle filtering organizations by starting letter of name
app.post("/AJ", async (req, res) => {
  try {
    // Query organizations with names starting with specific letters for the current user
    const result = await db.query(`
      SELECT * FROM organizations 
      WHERE user_id = $1 
      AND (name ILIKE 'A%' OR name ILIKE 'B%' OR name ILIKE 'C%' OR name ILIKE 'D%' OR name ILIKE 'E%' OR name ILIKE 'F%' OR name ILIKE 'G%' OR name ILIKE 'H%' OR name ILIKE 'I%' OR name ILIKE 'J%')
    `, [req.user.id]);

    const schoolResult = await db.query(`
      SELECT school FROM users WHERE id = $1
    `, [req.user.id]);
    const userSchool = schoolResult.rows[0].school; 

    // Render main page with filtered organizations
    res.render("main.ejs", {  
      listItems: result.rows,
      userSchool: userSchool
    });
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    res.status(500).send("Error fetching data from database");
  }
});


// Route to handle user logout
app.post("/logout", (req, res) => {
  // Log user out and redirect to home page
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});


// Route to render add organization page if user is authenticated
app.post("/add", (req, res) => {
  if (req.body.add) {
    if (req.isAuthenticated()) {
      res.render("add.ejs"); // Render add organization page
    } else {
      res.redirect("/"); // Redirect to home page if user is not authenticated
    }
  }
});

// Route to handle user login
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/main", // Redirect to main page on successful login
    failureRedirect: "/", // Redirect to home page on failed login
  })
);

// Route to handle user registration
app.post("/register", async (req, res) => {
  const email = req.body.username; // Extract email from request body
  const password = req.body.password; // Extract password from request body
  const school = req.body.school; // Extract school from request body

  try {
    // Check if user already exists with the given email
    const checkResult = await db.query(`
      SELECT * FROM users WHERE email = $1
    `, [email]);

    // Redirect to home page if user already exists
    if (checkResult.rows.length > 0) {
      res.redirect("/");
    } else {
      // Hash the password using bcrypt
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          // Insert user data into the database
          const result = await db.query(`
            INSERT INTO users (email, password, school) VALUES ($1, $2, $3) RETURNING id
          `, [email, hash, school]);
          const userId = result.rows[0].id; // Extract user ID from query result

          // Create a new table for the user
          await db.query(`
            CREATE TABLE IF NOT EXISTS organizations_${userId} (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255),
              phone_number VARCHAR(20),
              email VARCHAR(255),
              description TEXT,
              additional_info TEXT
            )
          `);

          // Prepare user object for login session
          const user = { id: userId, email: email };
          // Log the user in and redirect to main page
          req.login(user, (err) => {
            if (err) {
              console.error("Error logging in:", err);
            } else {
              console.log("success");
              res.redirect("/main");
            }
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error registering user");
  }
});

// Route to handle organization deletion
app.post("/delete", async (req, res) => {
  const id = req.body.delete; // Extract organization ID from request body
  try {
    // Delete organization from the database
    await db.query("DELETE FROM organizations WHERE id = $1", [id]);
    res.redirect("/main"); // Redirect to main page after deletion
  } catch(err) {
    console.log(err);
    res.status(500).send("Error deleting organization");
  }
});


// Define local authentication strategy for Passport
passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      // Query user with the given email
      const result = await db.query(`
        SELECT * FROM users WHERE email = $1
      `, [username]);
      
      // Check if user exists
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        
        // Compare hashed password with provided password
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user); // Return user if passwords match
            } else {
              return cb(null, false); // Return false if passwords don't match
            }
          }
        });
      } else {
        return cb("User not found"); // Return error if user not found
      }
    } catch (err) {
      console.log(err);
    }
  })
);


// Serialize user object to store in session
passport.serializeUser((user, cb) => {
  cb(null, user);
});

// Deserialize user object from session
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

// Start the server and listen on specified port
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
