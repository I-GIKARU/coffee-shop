Coffee Shop Web Application
Coffee Shop Screenshot Add actual screenshot of your application

A modern Single Page Application for a coffee shop with product browsing and admin management features.

Features
Customer Features
Browse Coffee Menu - View products with images, descriptions and prices

Search & Filter - Find coffees by name or category

Shopping Cart - Add multiple items and adjust quantities

Dark/Light Mode - Toggle between color themes

Admin Features
Product Management - Add/edit/delete coffee products

Category Management - Organize products into categories

Review Moderation - View and manage customer reviews

Technologies Used
Frontend:

HTML5, CSS3 (with CSS Variables for theming)

Vanilla JavaScript (ES6+)

Responsive design (works on all devices)

Backend:

JSON-server (mock REST API)

Local storage for theme preferences

Installation
Clone the repository:

bash
Copy
git clone https://github.com/I-GIKARU/coffee-shop
cd coffee-shop
Install dependencies:

bash
Copy
npm install -g json-server
Start the server:

bash
Copy
json-server --watch db.json --port 3000
Open index.html in your browser.

Usage Guide
For Customers
Browse Products:

Use the search bar to find specific coffees

Filter by category using the dropdown

Click on any product to view details

Shopping Cart:

Click "Add to Cart" on any product

Click the cart icon to review your order

Adjust quantities or remove items as needed

For Administrators
Access: Click "Admin" button and enter password: admin123

Manage Products:

Add new coffee items with images and details

Edit existing products

Remove discontinued items

Manage Categories:

Create new product categories

Remove unused categories

API Documentation
The application uses these RESTful endpoints:

Endpoint	Method	Description
/coffees	GET	Get all coffee products
/coffees	POST	Add new coffee (admin)
/coffees/:id	GET	Get specific coffee
/coffees/:id	PATCH	Update coffee (admin)
/coffees/:id	DELETE	Remove coffee (admin)
/categories	GET	Get all categories
/categories	POST	Add category (admin)
/categories/:id	DELETE	Remove category (admin)
/reviews	GET	Get all reviews
/reviews	POST	Submit new review
/reviews/:id	DELETE	Remove review (admin)
