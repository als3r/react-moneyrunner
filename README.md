# MoneyRunner - Budget Tracking App

A comprehensive budget tracking application built with Laravel backend and React frontend.

## Features

### MVP Features Implemented:
- **User Authentication**: Registration, login, and secure API access
- **Account Management**: Create and manage multiple accounts with different currencies
- **Expense Tracking**: Add, view, and filter expenses with categories and tags
- **Multi-Currency Support**: Support for multiple currencies with exchange rates
- **Category Management**: Hierarchical category structure for organizing expenses
- **Tag Management**: Flat tag system for expense labeling
- **Basic Reporting**: Overview dashboard with income/expense summaries

### Planned Features:
- **Advanced Reports**: Detailed reports with filtering by tags, categories, and time periods
- **Currency Exchange Rate Management**: Admin interface for managing exchange rates
- **Category Tree Management**: Full CRUD operations for hierarchical categories
- **Enhanced UI**: More sophisticated dashboard and reporting interfaces

## Tech Stack

### Backend:
- **Laravel 13.x** - PHP Framework
- **MySQL/SQLite** - Database
- **Laravel Sanctum** - API Authentication
- **Eloquent ORM** - Database Layer

### Frontend:
- **React 19.x** - UI Framework
- **React Router** - Client-side Routing
- **TailwindCSS** - Styling
- **Axios** - HTTP Client
- **Heroicons** - Icons

## Installation

### Prerequisites:
- PHP 8.2+
- Node.js 18+
- Composer
- MySQL or SQLite

### Backend Setup:

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
composer install
```

3. Set up environment:
```bash
cp .env.example .env
php artisan key:generate
```

4. Configure database in `.env` file

5. Run migrations and seed:
```bash
php artisan migrate
php artisan db:seed --class=CurrencySeeder
```

6. Start the Laravel server:
```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### Frontend Setup:

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev -- --host 127.0.0.1 --port 3000
```

## Usage

1. Register a new account at `http://localhost:3000/register`
2. Login and access the dashboard
3. Create accounts to track your finances
4. Add expenses and income transactions
5. View your financial overview

## API Endpoints

### Authentication:
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout (requires auth)

### Accounts:
- `GET /api/accounts` - List user accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/{id}` - Update account
- `DELETE /api/accounts/{id}` - Delete account

### Expenses:
- `GET /api/expenses` - List expenses with filtering
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense
- `GET /api/expenses/reports` - Get expense reports

### Categories:
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/tree` - Get category tree structure

### Tags:
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag

### Currencies:
- `GET /api/currencies` - List currencies
- `POST /api/currencies` - Create currency (admin)
- `POST /api/currencies/exchange-rates` - Update exchange rates (admin)

## Database Schema

The application uses the following main tables:
- `users` - User accounts
- `accounts` - Financial accounts
- `currencies` - Currency definitions
- `categories` - Hierarchical expense categories
- `tags` - Flat tagging system
- `expenses` - Financial transactions
- `expense_tag` - Many-to-many relationship between expenses and tags

## Security

- API authentication using Laravel Sanctum tokens
- User-specific data isolation
- Input validation and sanitization
- CSRF protection
- SQL injection prevention through Eloquent ORM

## Development

### Running Tests:
```bash
# Backend tests
cd backend && php artisan test

# Frontend tests (when implemented)
cd frontend && npm test
```

### Code Style:
- Backend follows PSR-12 coding standards
- Frontend uses ESLint and Prettier for consistent formatting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open-source and available under the MIT License.
