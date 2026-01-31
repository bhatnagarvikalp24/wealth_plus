# WealthPulse

A production-quality personal finance web platform to track month-on-month Income, Expenses, and Savings/Investments with category breakdowns and a Monthly Summary Dashboard.

## Features

- **Income Tracking**: Log income from multiple sources (Salary, Freelance, Business, etc.)
- **Expense Tracking**: Track expenses across categories (Rent, Groceries, Travel, etc.)
- **Savings & Investments**: Monitor savings in 4 categories:
  - FD/RD (Fixed/Recurring Deposits)
  - NPS/PPF (Retirement Funds)
  - Stocks/ETFs (Equities)
  - MF (Mutual Funds)
- **Monthly Dashboard**: Visual overview with KPIs and charts
  - Total Income, Expenses, Savings
  - Net Cash Flow
  - Savings Rate & Expense Ratio
  - Trend charts and breakdowns
- **CSV Export**: Export data for any month
- **Settings**: Manage income sources, expense categories, and savings instruments

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Credentials Provider)
- **Charts**: Recharts

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

## Quick Start

### 1. Clone and Install Dependencies

```bash
cd Financial_Diary_v1
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and update if needed:

```bash
cp .env.example .env
```

Default values should work for local development:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/financial_diary?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
```

### 3. Start PostgreSQL Database

```bash
docker compose up -d
```

This will start a PostgreSQL container on port 5432.

### 4. Run Database Migrations

```bash
npm run db:push
```

### 5. Seed Demo Data

```bash
npm run db:seed
```

This creates:
- Default savings instruments (FD, RD, NPS, PPF, Stocks, ETFs, MF)
- Demo user with credentials:
  - Email: `demo@example.com`
  - Password: `demo123`
- Default income sources and expense categories
- 4 months of sample financial data

### 6. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and log in with the demo credentials.

## Project Structure

```
├── docker-compose.yml          # PostgreSQL container
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed script
├── src/
│   ├── app/
│   │   ├── (auth)/             # Auth pages (login, register)
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── income/         # Income management
│   │   │   ├── expenses/       # Expense management
│   │   │   ├── savings/        # Savings management
│   │   │   └── settings/       # Masters/Settings
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── layout/             # Sidebar, Header
│   │   └── ui/                 # shadcn/ui components
│   └── lib/
│       ├── auth.ts             # NextAuth configuration
│       ├── prisma.ts           # Prisma client
│       ├── utils.ts            # Utility functions
│       └── validations.ts      # Zod schemas
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Income
- `GET /api/income?month=YYYY-MM` - Get income entries
- `POST /api/income` - Create income entry
- `PUT /api/income/[id]` - Update income entry
- `DELETE /api/income/[id]` - Delete income entry

### Expenses
- `GET /api/expenses?month=YYYY-MM` - Get expense entries
- `POST /api/expenses` - Create expense entry
- `PUT /api/expenses/[id]` - Update expense entry
- `DELETE /api/expenses/[id]` - Delete expense entry

### Savings
- `GET /api/savings?month=YYYY-MM` - Get savings entries
- `POST /api/savings` - Create savings entry
- `PUT /api/savings/[id]` - Update savings entry
- `DELETE /api/savings/[id]` - Delete savings entry

### Dashboard
- `GET /api/dashboard?from=YYYY-MM&to=YYYY-MM` - Get aggregated dashboard data

### Export
- `GET /api/export?month=YYYY-MM&type=income|expenses|savings|summary` - Export CSV

### Masters
- `GET/POST /api/masters/income-sources` - Income sources
- `PUT/DELETE /api/masters/income-sources/[id]`
- `GET/POST /api/masters/expense-verticals` - Expense categories
- `PUT/DELETE /api/masters/expense-verticals/[id]`
- `GET/POST /api/masters/savings-instruments` - Savings instruments
- `PUT/DELETE /api/masters/savings-instruments/[id]`

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Reset database and reseed
npm run db:reset

# Open Prisma Studio
npm run db:studio

# Run seed script
npm run db:seed
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Production Deployment

### Option 1: Docker Compose (Recommended)

1. **Set up environment variables**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Edit `.env.production`** with secure values:
   ```env
   POSTGRES_PASSWORD=your-secure-db-password
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=https://your-domain.com
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Run database migrations**
   ```bash
   docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
   ```

### Option 2: Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables** on your server

3. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Production Checklist

- [ ] Set a strong `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- [ ] Use a secure database password
- [ ] Configure `NEXTAUTH_URL` to your actual domain
- [ ] Enable HTTPS (recommended for production)
- [ ] Set up database backups
- [ ] Consider a reverse proxy (nginx, Caddy) for SSL termination

## Screenshots

### Dashboard
- Monthly trends chart
- Income/Expense/Savings KPIs
- Breakdown by category

### Income/Expense/Savings Pages
- Month selector
- Add/Edit/Delete entries
- Export to CSV

### Settings
- Manage income sources
- Manage expense categories
- Manage savings instruments

## Security

- All routes are protected with NextAuth session
- API routes validate authentication server-side
- Passwords are hashed with bcrypt
- Input validation with Zod schemas
- Referential integrity enforced in database

## License

MIT
