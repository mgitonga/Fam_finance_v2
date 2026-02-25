# FamFin — Functional Specification Document v1.0

**Family Budget & Finance Tracking Application**

---

| Field            | Value                               |
| ---------------- | ----------------------------------- |
| Document Version | 1.0                                 |
| Date             | February 20, 2026                   |
| Status           | DRAFT — Awaiting Sign-off           |
| Prepared by      | Systems Analyst (GitHub Copilot)    |
| Target Launch    | April–May 2026 (MVP)                |
| Primary Currency | KES (Kenyan Shilling)               |
| Hosting          | Cloud Free Tier (Vercel + Supabase) |

> ⚠️ **DRAFT DOCUMENT** — Pending client review and sign-off before development begins

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [User Roles & Authentication](#4-user-roles--authentication)
5. [Data Model](#5-data-model)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [UI/UX Wireframe Descriptions](#8-uiux-wireframe-descriptions)
9. [API Specification](#9-api-specification)
10. [MVP Scope & Phased Delivery](#10-mvp-scope--phased-delivery)
11. [Project Plan & Timeline](#11-project-plan--timeline)
12. [Deployment Strategy](#12-deployment-strategy)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

**FamFin** is a personal and family budgeting & finance tracking web application designed for a husband-and-wife household. The app replaces a manual Google Forms + Google Sheets workflow with an automated, dashboard-driven experience.

Users will track income and expenses, set category-based budgets, manage savings goals and debt, receive bill reminders, upload receipts, and generate financial reports — all from a responsive web app accessible on desktop and mobile browsers.

| Aspect           | Detail                                       |
| ---------------- | -------------------------------------------- |
| Primary Currency | KES (Kenyan Shilling)                        |
| Target Launch    | April 2026 (MVP Alpha) / May 2026 (Full MVP) |
| Hosting          | Cloud free-tier (Vercel + Supabase)          |
| Initial Users    | 2 (Husband — Admin, Wife — Contributor)      |
| Future Scope     | Small business finance tracking              |

---

## 2. Project Overview

### 2.1 Problem Statement

The clients currently use Google Forms to log expenses and manually build dashboards in Google Sheets. This workflow is:

- **Time-consuming** — manual report creation and dashboard building
- **No real-time tracking** — no automated budget tracking or alerts
- **No recurring transactions** — manual re-entry every month
- **No financial planning** — no savings goals or debt tracking
- **No receipt storage** — receipts are disconnected from expense records
- **No access control** — no role-based permissions

### 2.2 Solution

A responsive web application (PWA) with:

- Automated dashboards
- Budget tracking with color-coded alerts
- Recurring transaction reminders
- Savings goals & debt management
- Receipt image uploads
- Role-based access
- CSV import/export
- PDF report generation

### 2.3 Users

| User             | Role        | Description                                                     |
| ---------------- | ----------- | --------------------------------------------------------------- |
| Client (Husband) | Admin       | Full access — manage categories, budgets, users, goals, reports |
| Client (Wife)    | Contributor | Add/edit transactions, view reports & dashboards, export data   |

### 2.4 Future Scope (Post-MVP)

| Feature                          | Description                                             | Phase   |
| -------------------------------- | ------------------------------------------------------- | ------- |
| Multi-currency                   | Support multiple currencies with exchange rates         | Phase 2 |
| Bank integration                 | Plaid / M-Pesa API for auto-importing transactions      | Phase 2 |
| OCR receipts                     | Extract data from receipt photos automatically          | Phase 2 |
| Split expense balances           | Running balance of who owes whom                        | Phase 2 |
| Additional debt types            | Car loan, personal loan, credit card, student loan      | Phase 2 |
| Additional recurring frequencies | Weekly, bi-weekly, quarterly, annually                  | Phase 2 |
| Native mobile apps               | React Native or Flutter apps for iOS & Android          | Phase 2 |
| Small business support           | Multi-household, invoicing, tax categories, P&L reports | Phase 3 |

---

## 3. System Architecture

### 3.1 Technology Stack

| Layer              | Technology                          | Rationale                                              |
| ------------------ | ----------------------------------- | ------------------------------------------------------ |
| **Frontend**       | Next.js 14+ (React) with TypeScript | SSR, responsive, PWA-capable, works on all devices     |
| **UI Library**     | Tailwind CSS + shadcn/ui            | Modern, accessible, rapid development                  |
| **Charts**         | Recharts                            | Lightweight, React-native charting library             |
| **Backend / API**  | Next.js API Routes + Supabase       | Serverless, free tier, integrated auth & storage       |
| **Database**       | Supabase (PostgreSQL)               | Free tier, Row Level Security, real-time subscriptions |
| **Authentication** | Supabase Auth                       | Email/password, JWT, built-in role management          |
| **File Storage**   | Supabase Storage (S3-compatible)    | Receipt image uploads, integrated with auth            |
| **Hosting**        | Vercel (free tier)                  | Automatic deployments, edge network, SSL               |
| **Email**          | Resend (free tier)                  | Bill reminders & budget alert emails                   |
| **PWA**            | next-pwa                            | Installable on mobile home screen                      |

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                  CLIENT DEVICES                  │
│   Desktop Browser / Mobile Browser / PWA         │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────┐
│              VERCEL (Cloud Hosting)              │
│  ┌────────────────────────────────────────────┐  │
│  │         Next.js Application                │  │
│  │  ┌──────────┐  ┌───────────┐  ┌─────────┐ │  │
│  │  │  Pages/   │  │   API     │  │  Auth   │ │  │
│  │  │  UI       │  │  Routes   │  │ Middle- │ │  │
│  │  │  Comps    │  │           │  │  ware   │ │  │
│  │  └──────────┘  └─────┬─────┘  └─────────┘ │  │
│  └───────────────────────┼────────────────────┘  │
└──────────────────────────┼───────────────────────┘
                           │
┌──────────────────────────▼───────────────────────┐
│               SUPABASE (Backend)                 │
│  ┌─────────────┐ ┌──────────┐ ┌───────────────┐ │
│  │ PostgreSQL   │ │  Auth    │ │   Storage     │ │
│  │ Database     │ │ Service  │ │ (Receipts)    │ │
│  │ + RLS        │ │          │ │               │ │
│  └─────────────┘ └──────────┘ └───────────────┘ │
└──────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────┐
│            RESEND (Email Service)                │
│         Bill Reminders & Budget Alerts           │
└──────────────────────────────────────────────────┘
```

---

## 4. User Roles & Authentication

### 4.1 Authentication

| Aspect          | Specification                                                   |
| --------------- | --------------------------------------------------------------- |
| Method          | Email + Password (Supabase Auth)                                |
| Session         | JWT-based, persistent login                                     |
| Password Policy | Minimum 8 characters, at least 1 number and 1 special character |
| Password Reset  | Email-based flow via Supabase                                   |

### 4.2 Role Permissions Matrix

| Capability                       | Admin | Contributor |
| -------------------------------- | ----- | ----------- |
| Add transactions                 | ✅    | ✅          |
| Edit own transactions            | ✅    | ✅          |
| Delete own transactions          | ✅    | ✅          |
| Edit/delete others' transactions | ✅    | ❌          |
| View all transactions            | ✅    | ✅          |
| View dashboards & reports        | ✅    | ✅          |
| Export data (CSV/PDF)            | ✅    | ✅          |
| Upload receipts                  | ✅    | ✅          |
| Create/edit/delete categories    | ✅    | ❌          |
| Set/modify budgets               | ✅    | ❌          |
| Manage savings goals             | ✅    | ❌          |
| Manage debt tracking             | ✅    | ❌          |
| Manage recurring transactions    | ✅    | ❌          |
| Manage bill reminders            | ✅    | ❌          |
| Manage users & roles             | ✅    | ❌          |
| Import CSV data                  | ✅    | ❌          |
| Manage accounts                  | ✅    | ❌          |

---

## 5. Data Model

### 5.1 Entity Relationship Overview

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    users      │       │   households     │       │    accounts      │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)      │──┐    │ id (PK)          │    ┌──│ id (PK)          │
│ email        │  └──>│ name             │    │  │ household_id(FK) │
│ name         │       │ primary_currency │    │  │ name             │
│ role         │       │ created_at       │    │  │ type             │
│ household_id │───>  └──────────────────┘    │  │ balance          │
│ created_at   │                              │  └──────────────────┘
└──────────────┘                              │
                                              │
┌──────────────────┐    ┌─────────────────────▼────┐
│  categories      │    │      transactions        │
├──────────────────┤    ├──────────────────────────┤
│ id (PK)          │    │ id (PK)                  │
│ household_id(FK) │    │ household_id (FK)        │
│ name             │◄───│ category_id (FK)         │
│ parent_id (FK)   │    │ account_id (FK)          │
│ type             │    │ user_id (FK)             │
│ is_active        │    │ type (income/expense)    │
└──────────────────┘    │ amount, date, merchant   │
                        │ payment_method, tags     │
┌──────────────────┐    │ receipt_url, notes       │
│    budgets       │    └──────────────────────────┘
├──────────────────┤
│ id (PK)          │    ┌──────────────────────────┐
│ household_id(FK) │    │  recurring_transactions  │
│ category_id (FK) │    ├──────────────────────────┤
│ amount           │    │ id (PK)                  │
│ month / year     │    │ household_id, category_id│
└──────────────────┘    │ amount, frequency        │
                        │ day_of_month             │
┌──────────────────┐    │ next_due_date            │
│  savings_goals   │    └──────────────────────────┘
├──────────────────┤
│ id (PK)          │    ┌──────────────────────────┐
│ name             │    │     debts                │
│ target_amount    │    ├──────────────────────────┤
│ current_amount   │    │ id (PK)                  │
│ target_date      │    │ name, type               │
│ is_completed     │    │ original_amount          │
└──────────────────┘    │ outstanding_balance      │
         │              │ interest_rate            │
         ▼              │ minimum_payment          │
┌──────────────────┐    │ projected_payoff_date    │
│goal_contributions│    └──────────────────────────┘
├──────────────────┤
│ goal_id (FK)     │    ┌──────────────────────────┐
│ amount, date     │    │  bill_reminders          │
└──────────────────┘    │  notifications           │
                        └──────────────────────────┘
```

### 5.2 Table Definitions

#### 5.2.1 `users`

| Column       | Type                        | Constraints                     | Description               |
| ------------ | --------------------------- | ------------------------------- | ------------------------- |
| id           | UUID                        | PK, auto                        | Supabase auth user ID     |
| email        | VARCHAR(255)                | UNIQUE, NOT NULL                | Login email               |
| name         | VARCHAR(100)                | NOT NULL                        | Display name              |
| role         | ENUM('admin','contributor') | NOT NULL, DEFAULT 'contributor' | User role                 |
| household_id | UUID                        | FK → households                 | Household membership      |
| avatar_url   | TEXT                        | NULLABLE                        | Profile picture URL       |
| created_at   | TIMESTAMPTZ                 | DEFAULT NOW()                   | Record creation timestamp |

#### 5.2.2 `households`

| Column           | Type         | Constraints             | Description              |
| ---------------- | ------------ | ----------------------- | ------------------------ |
| id               | UUID         | PK, auto                | Household ID             |
| name             | VARCHAR(100) | NOT NULL                | e.g., "The Smith Family" |
| primary_currency | VARCHAR(3)   | NOT NULL, DEFAULT 'KES' | ISO currency code        |
| created_at       | TIMESTAMPTZ  | DEFAULT NOW()           | Record creation          |

#### 5.2.3 `accounts`

| Column       | Type                                                     | Constraints     | Description                     |
| ------------ | -------------------------------------------------------- | --------------- | ------------------------------- |
| id           | UUID                                                     | PK, auto        | Account ID                      |
| household_id | UUID                                                     | FK → households | Household                       |
| name         | VARCHAR(100)                                             | NOT NULL        | e.g., "Joint Account", "M-Pesa" |
| type         | ENUM('bank','mobile_money','cash','credit_card','other') | NOT NULL        | Account type                    |
| balance      | DECIMAL(15,2)                                            | DEFAULT 0       | Current balance                 |
| is_active    | BOOLEAN                                                  | DEFAULT TRUE    | Soft delete flag                |
| created_at   | TIMESTAMPTZ                                              | DEFAULT NOW()   | Record creation                 |

#### 5.2.4 `categories`

| Column       | Type                            | Constraints               | Description                 |
| ------------ | ------------------------------- | ------------------------- | --------------------------- |
| id           | UUID                            | PK, auto                  | Category ID                 |
| household_id | UUID                            | FK → households           | Household                   |
| name         | VARCHAR(100)                    | NOT NULL                  | Category name               |
| parent_id    | UUID                            | FK → categories, NULLABLE | Parent (for sub-categories) |
| icon         | VARCHAR(50)                     | NULLABLE                  | Icon identifier             |
| color        | VARCHAR(7)                      | NULLABLE                  | Hex color code              |
| type         | ENUM('expense','income','both') | DEFAULT 'expense'         | Category type               |
| is_active    | BOOLEAN                         | DEFAULT TRUE              | Soft delete flag            |
| sort_order   | INT                             | DEFAULT 0                 | Display order               |
| created_at   | TIMESTAMPTZ                     | DEFAULT NOW()             | Record creation             |

#### 5.2.5 `transactions`

| Column         | Type                                                       | Constraints                           | Description                    |
| -------------- | ---------------------------------------------------------- | ------------------------------------- | ------------------------------ |
| id             | UUID                                                       | PK, auto                              | Transaction ID                 |
| household_id   | UUID                                                       | FK → households                       | Household                      |
| account_id     | UUID                                                       | FK → accounts                         | Which account                  |
| category_id    | UUID                                                       | FK → categories                       | Category                       |
| user_id        | UUID                                                       | FK → users                            | Who entered it                 |
| type           | ENUM('income','expense')                                   | NOT NULL                              | Transaction type               |
| amount         | DECIMAL(15,2)                                              | NOT NULL, > 0                         | Amount in KES                  |
| date           | DATE                                                       | NOT NULL                              | Transaction date               |
| description    | TEXT                                                       | NULLABLE                              | Description                    |
| merchant       | VARCHAR(200)                                               | NULLABLE                              | Vendor/merchant name           |
| payment_method | ENUM('cash','card','mobile_money','bank_transfer','other') | NULLABLE                              | Payment method                 |
| tags           | TEXT[]                                                     | NULLABLE                              | Array of tags/labels           |
| receipt_url    | TEXT                                                       | NULLABLE                              | Receipt image storage path     |
| is_recurring   | BOOLEAN                                                    | DEFAULT FALSE                         | Flagged as recurring           |
| recurring_id   | UUID                                                       | FK → recurring_transactions, NULLABLE | Source recurring rule          |
| split_with     | UUID                                                       | FK → users, NULLABLE                  | Split partner                  |
| split_ratio    | DECIMAL(3,2)                                               | NULLABLE                              | This user's share (e.g., 0.60) |
| notes          | TEXT                                                       | NULLABLE                              | Additional notes               |
| created_at     | TIMESTAMPTZ                                                | DEFAULT NOW()                         | Record creation                |
| updated_at     | TIMESTAMPTZ                                                | DEFAULT NOW()                         | Last updated                   |

#### 5.2.6 `budgets`

| Column       | Type          | Constraints     | Description         |
| ------------ | ------------- | --------------- | ------------------- |
| id           | UUID          | PK, auto        | Budget ID           |
| household_id | UUID          | FK → households | Household           |
| category_id  | UUID          | FK → categories | Category            |
| amount       | DECIMAL(15,2) | NOT NULL, > 0   | Budget limit in KES |
| month        | INT           | 1–12            | Month               |
| year         | INT           | NOT NULL        | Year                |
| created_at   | TIMESTAMPTZ   | DEFAULT NOW()   | Record creation     |

> 📌 **Constraint:** UNIQUE on (household_id, category_id, month, year)

#### 5.2.7 `overall_budgets`

| Column       | Type          | Constraints     | Description                |
| ------------ | ------------- | --------------- | -------------------------- |
| id           | UUID          | PK, auto        | Budget ID                  |
| household_id | UUID          | FK → households | Household                  |
| amount       | DECIMAL(15,2) | NOT NULL, > 0   | Overall monthly cap in KES |
| month        | INT           | 1–12            | Month                      |
| year         | INT           | NOT NULL        | Year                       |
| created_at   | TIMESTAMPTZ   | DEFAULT NOW()   | Record creation            |

#### 5.2.8 `recurring_transactions`

| Column        | Type                     | Constraints       | Description              |
| ------------- | ------------------------ | ----------------- | ------------------------ |
| id            | UUID                     | PK, auto          | Rule ID                  |
| household_id  | UUID                     | FK → households   | Household                |
| category_id   | UUID                     | FK → categories   | Category                 |
| account_id    | UUID                     | FK → accounts     | Account                  |
| type          | ENUM('income','expense') | NOT NULL          | Transaction type         |
| amount        | DECIMAL(15,2)            | NOT NULL          | Amount                   |
| frequency     | ENUM('monthly')          | DEFAULT 'monthly' | Frequency (expand later) |
| day_of_month  | INT                      | 1–31              | Day it occurs            |
| next_due_date | DATE                     | NOT NULL          | Next occurrence          |
| description   | VARCHAR(200)             | NOT NULL          | Description              |
| is_active     | BOOLEAN                  | DEFAULT TRUE      | Active flag              |
| created_at    | TIMESTAMPTZ              | DEFAULT NOW()     | Record creation          |

#### 5.2.9 `savings_goals`

| Column         | Type          | Constraints     | Description          |
| -------------- | ------------- | --------------- | -------------------- |
| id             | UUID          | PK, auto        | Goal ID              |
| household_id   | UUID          | FK → households | Household            |
| name           | VARCHAR(100)  | NOT NULL        | Goal name            |
| target_amount  | DECIMAL(15,2) | NOT NULL        | Target amount in KES |
| current_amount | DECIMAL(15,2) | DEFAULT 0       | Amount saved so far  |
| target_date    | DATE          | NOT NULL        | Deadline             |
| icon           | VARCHAR(50)   | NULLABLE        | Icon identifier      |
| color          | VARCHAR(7)    | NULLABLE        | Hex color code       |
| is_completed   | BOOLEAN       | DEFAULT FALSE   | Completed flag       |
| created_at     | TIMESTAMPTZ   | DEFAULT NOW()   | Record creation      |

#### 5.2.10 `goal_contributions`

| Column     | Type          | Constraints        | Description         |
| ---------- | ------------- | ------------------ | ------------------- |
| id         | UUID          | PK, auto           | Contribution ID     |
| goal_id    | UUID          | FK → savings_goals | Goal                |
| user_id    | UUID          | FK → users         | Who contributed     |
| amount     | DECIMAL(15,2) | NOT NULL           | Contribution amount |
| date       | DATE          | NOT NULL           | Date                |
| notes      | TEXT          | NULLABLE           | Notes               |
| created_at | TIMESTAMPTZ   | DEFAULT NOW()      | Record creation     |

#### 5.2.11 `debts`

| Column                | Type                                                                             | Constraints     | Description             |
| --------------------- | -------------------------------------------------------------------------------- | --------------- | ----------------------- |
| id                    | UUID                                                                             | PK, auto        | Debt ID                 |
| household_id          | UUID                                                                             | FK → households | Household               |
| name                  | VARCHAR(100)                                                                     | NOT NULL        | e.g., "KCB Mortgage"    |
| type                  | ENUM('mortgage','car_loan','personal_loan','credit_card','student_loan','other') | NOT NULL        | Debt type               |
| original_amount       | DECIMAL(15,2)                                                                    | NOT NULL        | Original principal      |
| outstanding_balance   | DECIMAL(15,2)                                                                    | NOT NULL        | Current balance         |
| interest_rate         | DECIMAL(5,2)                                                                     | NULLABLE        | Annual interest rate %  |
| minimum_payment       | DECIMAL(15,2)                                                                    | NULLABLE        | Monthly minimum payment |
| payment_day           | INT                                                                              | 1–31            | Day payment is due      |
| start_date            | DATE                                                                             | NOT NULL        | Loan start date         |
| projected_payoff_date | DATE                                                                             | NULLABLE        | Estimated payoff date   |
| is_active             | BOOLEAN                                                                          | DEFAULT TRUE    | Active flag             |
| created_at            | TIMESTAMPTZ                                                                      | DEFAULT NOW()   | Record creation         |

#### 5.2.12 `bill_reminders`

| Column               | Type                          | Constraints     | Description           |
| -------------------- | ----------------------------- | --------------- | --------------------- |
| id                   | UUID                          | PK, auto        | Reminder ID           |
| household_id         | UUID                          | FK → households | Household             |
| name                 | VARCHAR(100)                  | NOT NULL        | Bill name             |
| amount               | DECIMAL(15,2)                 | NULLABLE        | Expected amount       |
| due_day              | INT                           | 1–31            | Day of month due      |
| category_id          | UUID                          | FK → categories | Category              |
| reminder_days_before | INT                           | DEFAULT 3       | Days before to remind |
| notification_method  | ENUM('in_app','email','both') | DEFAULT 'both'  | How to notify         |
| is_active            | BOOLEAN                       | DEFAULT TRUE    | Active flag           |
| created_at           | TIMESTAMPTZ                   | DEFAULT NOW()   | Record creation       |

#### 5.2.13 `notifications`

| Column       | Type                                                                                               | Constraints     | Description           |
| ------------ | -------------------------------------------------------------------------------------------------- | --------------- | --------------------- |
| id           | UUID                                                                                               | PK, auto        | Notification ID       |
| household_id | UUID                                                                                               | FK → households | Household             |
| user_id      | UUID                                                                                               | FK → users      | Target user           |
| type         | ENUM('bill_reminder','budget_warning','budget_exceeded','goal_milestone','recurring_due','system') | NOT NULL        | Notification type     |
| title        | VARCHAR(200)                                                                                       | NOT NULL        | Title                 |
| message      | TEXT                                                                                               | NOT NULL        | Message body          |
| is_read      | BOOLEAN                                                                                            | DEFAULT FALSE   | Read status           |
| action_url   | TEXT                                                                                               | NULLABLE        | Link to relevant page |
| created_at   | TIMESTAMPTZ                                                                                        | DEFAULT NOW()   | Creation timestamp    |

---

## 6. Functional Requirements

### FR-01: User Authentication & Management

| ID      | Requirement                                                    | Priority  |
| ------- | -------------------------------------------------------------- | --------- |
| FR-01.1 | Users can register with email and password                     | Must Have |
| FR-01.2 | Users can log in / log out                                     | Must Have |
| FR-01.3 | Users can reset password via email                             | Must Have |
| FR-01.4 | Admin can invite a user to the household by email              | Must Have |
| FR-01.5 | Admin can assign/change user roles (Admin/Contributor)         | Must Have |
| FR-01.6 | System creates a default household on first admin registration | Must Have |
| FR-01.7 | Users can update their profile (name, avatar)                  | Must Have |

### FR-02: Account Management

| ID      | Requirement                                                                      | Priority  |
| ------- | -------------------------------------------------------------------------------- | --------- |
| FR-02.1 | Admin can create financial accounts (bank, M-Pesa, cash, credit card)            | Must Have |
| FR-02.2 | Admin can edit/deactivate accounts                                               | Must Have |
| FR-02.3 | System displays account balances on dashboard                                    | Must Have |
| FR-02.4 | Account balances update automatically when transactions are added/edited/deleted | Must Have |

### FR-03: Category Management

| ID      | Requirement                                                                    | Priority  |
| ------- | ------------------------------------------------------------------------------ | --------- |
| FR-03.1 | System pre-populates default categories on household creation (see Appendix A) | Must Have |
| FR-03.2 | Admin can create custom categories and sub-categories                          | Must Have |
| FR-03.3 | Admin can edit category name, icon, color                                      | Must Have |
| FR-03.4 | Admin can deactivate categories (soft delete — preserves historical data)      | Must Have |
| FR-03.5 | Categories support parent-child hierarchy (1 level deep for MVP)               | Must Have |
| FR-03.6 | Categories can be typed as income, expense, or both                            | Must Have |

### FR-04: Transaction Management

| ID       | Requirement                                                                                                                                      | Priority  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| FR-04.1  | Users can add a new transaction with: date, amount, type (income/expense), category, account, description, merchant, payment method, tags, notes | Must Have |
| FR-04.2  | Users can edit their own transactions                                                                                                            | Must Have |
| FR-04.3  | Users can delete their own transactions                                                                                                          | Must Have |
| FR-04.4  | Admin can edit/delete any transaction                                                                                                            | Must Have |
| FR-04.5  | Users can upload a receipt image (JPG, PNG, PDF; max 5MB) when creating/editing a transaction                                                    | Must Have |
| FR-04.6  | Users can view receipt images attached to transactions                                                                                           | Must Have |
| FR-04.7  | Users can filter transactions by: date range, category, account, type, user, payment method, tags                                                | Must Have |
| FR-04.8  | Users can search transactions by description or merchant                                                                                         | Must Have |
| FR-04.9  | Transaction list supports pagination (20 per page)                                                                                               | Must Have |
| FR-04.10 | Users can sort transactions by date, amount, category                                                                                            | Must Have |
| FR-04.11 | Users can mark a transaction as a split expense with a custom ratio                                                                              | Must Have |
| FR-04.12 | System validates that amount > 0 and required fields are present                                                                                 | Must Have |

### FR-05: Budget Management

| ID       | Requirement                                                                                  | Priority  |
| -------- | -------------------------------------------------------------------------------------------- | --------- |
| FR-05.1  | Admin can set a monthly budget per category                                                  | Must Have |
| FR-05.2  | Admin can set an overall monthly budget cap                                                  | Must Have |
| FR-05.3  | Budgets default to the same amount each month (auto-copy from previous month)                | Must Have |
| FR-05.4  | Admin can adjust budget for a specific month                                                 | Must Have |
| FR-05.5  | Dashboard shows progress bars for each category budget (spent vs. limit)                     | Must Have |
| FR-05.6  | Progress bars change color: green (< 70%), amber (70–90%), red (> 90%)                       | Must Have |
| FR-05.7  | System generates in-app notification when spending reaches 80% of a category budget          | Must Have |
| FR-05.8  | System generates in-app notification when spending exceeds a category budget                 | Must Have |
| FR-05.9  | System generates in-app notification when overall monthly spending reaches 80% / exceeds cap | Must Have |
| FR-05.10 | Budget notifications also sent via email                                                     | Must Have |

### FR-06: Recurring Transactions

| ID      | Requirement                                                                                                            | Priority  |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| FR-06.1 | Admin can create recurring transaction rules (monthly frequency, day of month, amount, category, account, description) | Must Have |
| FR-06.2 | Admin can edit/deactivate recurring rules                                                                              | Must Have |
| FR-06.3 | System generates a reminder notification (in-app + email) when a recurring transaction is due                          | Must Have |
| FR-06.4 | User can "confirm" a recurring reminder which creates the actual transaction (pre-filled, editable before saving)      | Must Have |
| FR-06.5 | User can "skip" a recurring reminder for a given month                                                                 | Must Have |
| FR-06.6 | System shows list of upcoming recurring transactions                                                                   | Must Have |

### FR-07: Savings Goals

| ID      | Requirement                                                                          | Priority  |
| ------- | ------------------------------------------------------------------------------------ | --------- |
| FR-07.1 | Admin can create a savings goal with: name, target amount, target date, icon, color  | Must Have |
| FR-07.2 | Admin can edit/delete savings goals                                                  | Must Have |
| FR-07.3 | Users can add contributions to a savings goal (amount, date, notes)                  | Must Have |
| FR-07.4 | System shows progress (current_amount / target_amount as percentage)                 | Must Have |
| FR-07.5 | System calculates "required monthly contribution" to reach goal on time              | Must Have |
| FR-07.6 | Dashboard shows savings goal progress bars                                           | Must Have |
| FR-07.7 | System marks goal as completed when current_amount ≥ target_amount                   | Must Have |
| FR-07.8 | System generates notification when a goal milestone is reached (25%, 50%, 75%, 100%) | Must Have |

### FR-08: Debt Tracking

| ID      | Requirement                                                                                                                                             | Priority  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FR-08.1 | Admin can add a debt with: name, type (mortgage for MVP), original amount, outstanding balance, interest rate, minimum payment, payment day, start date | Must Have |
| FR-08.2 | Admin can edit/deactivate debts                                                                                                                         | Must Have |
| FR-08.3 | System calculates projected payoff date based on minimum payment and interest rate                                                                      | Must Have |
| FR-08.4 | User can log a debt payment (updates outstanding balance and creates a transaction)                                                                     | Must Have |
| FR-08.5 | Dashboard shows debt summary: total outstanding, monthly payments due                                                                                   | Must Have |
| FR-08.6 | System generates bill reminder for debt payments                                                                                                        | Must Have |

### FR-09: Bill Reminders

| ID      | Requirement                                                                                                               | Priority  |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | --------- |
| FR-09.1 | Admin can create bill reminders with: name, amount, due day, category, reminder days before due date, notification method | Must Have |
| FR-09.2 | Admin can edit/deactivate reminders                                                                                       | Must Have |
| FR-09.3 | System sends in-app notifications X days before due date                                                                  | Must Have |
| FR-09.4 | System sends email notifications X days before due date                                                                   | Must Have |
| FR-09.5 | Dashboard shows "Upcoming Bills" widget with next 5 bills due                                                             | Must Have |

### FR-10: Reports & Charts

| ID      | Requirement                                                                                              | Priority  |
| ------- | -------------------------------------------------------------------------------------------------------- | --------- |
| FR-10.1 | **Monthly Summary:** Total income, total expenses, net (income − expenses), comparison to previous month | Must Have |
| FR-10.2 | **Category Breakdown:** Pie/donut chart showing expense distribution by category for selected month      | Must Have |
| FR-10.3 | **Income vs. Expenses:** Bar chart comparing income and expenses over time (last 6/12 months)            | Must Have |
| FR-10.4 | **Net Worth Over Time:** Line chart showing net worth (total assets − total debts) over time             | Must Have |
| FR-10.5 | **Budget vs. Actual:** Bar chart comparing budgeted vs. actual spending per category                     | Must Have |
| FR-10.6 | **Spending Trends:** Line chart showing spending by category over time                                   | Must Have |
| FR-10.7 | All reports support date range filtering                                                                 | Must Have |
| FR-10.8 | All reports can be filtered by account, category, user                                                   | Must Have |
| FR-10.9 | Reports page shows key metrics cards: total income, total expenses, net savings, budget remaining        | Must Have |

### FR-11: Data Export

| ID      | Requirement                                                 | Priority  |
| ------- | ----------------------------------------------------------- | --------- |
| FR-11.1 | Users can export transactions to CSV with date range filter | Must Have |
| FR-11.2 | Users can export monthly summary report to PDF              | Must Have |
| FR-11.3 | CSV export includes all transaction fields                  | Must Have |
| FR-11.4 | PDF export includes charts and summary tables               | Must Have |

### FR-12: Data Import

| ID      | Requirement                                                                                 | Priority  |
| ------- | ------------------------------------------------------------------------------------------- | --------- |
| FR-12.1 | Admin can import transactions from CSV file                                                 | Must Have |
| FR-12.2 | System provides a CSV template for download                                                 | Must Have |
| FR-12.3 | System validates CSV data before importing (required fields, data types, category matching) | Must Have |
| FR-12.4 | System shows preview of data before confirming import                                       | Must Have |
| FR-12.5 | System reports import results (success count, error count, error details)                   | Must Have |

### FR-13: Notifications Center

| ID      | Requirement                                                                                               | Priority  |
| ------- | --------------------------------------------------------------------------------------------------------- | --------- |
| FR-13.1 | Bell icon in header shows unread notification count badge                                                 | Must Have |
| FR-13.2 | Clicking bell opens notification dropdown/panel                                                           | Must Have |
| FR-13.3 | Users can mark individual notifications as read                                                           | Must Have |
| FR-13.4 | Users can mark all notifications as read                                                                  | Must Have |
| FR-13.5 | Notification types: bill_reminder, budget_warning, budget_exceeded, goal_milestone, recurring_due, system | Must Have |

### FR-14: Dashboard

| ID       | Requirement                                                                                         | Priority  |
| -------- | --------------------------------------------------------------------------------------------------- | --------- |
| FR-14.1  | Dashboard is the default landing page after login                                                   | Must Have |
| FR-14.2  | **Widget: Monthly Spending vs. Budget** — Progress bars per category, color-coded (green/amber/red) | Must Have |
| FR-14.3  | **Widget: Recent Transactions** — Last 10 transactions with quick-add button                        | Must Have |
| FR-14.4  | **Widget: Upcoming Bills** — Next 5 bills due with days remaining                                   | Must Have |
| FR-14.5  | **Widget: Savings Goals** — Progress bars for each active goal                                      | Must Have |
| FR-14.6  | **Widget: Income vs. Expenses** — Bar chart for current month                                       | Must Have |
| FR-14.7  | **Widget: Overall Budget** — Circular progress showing total spent / total budget                   | Must Have |
| FR-14.8  | **Widget: Account Balances** — Quick view of all account balances                                   | Must Have |
| FR-14.9  | Dashboard data scoped to the user's household                                                       | Must Have |
| FR-14.10 | Dashboard shows current month by default, with month/year selector                                  | Must Have |

---

## 7. Non-Functional Requirements

| ID     | Requirement                                                                          | Category      |
| ------ | ------------------------------------------------------------------------------------ | ------------- |
| NFR-01 | App must be responsive (mobile-first) — works on screens from 320px to 2560px        | UX            |
| NFR-02 | Page load time < 2 seconds on 3G connection                                          | Performance   |
| NFR-03 | PWA installable on mobile devices (home screen icon, offline shell)                  | Accessibility |
| NFR-04 | All data isolated by household (Row Level Security in Supabase)                      | Security      |
| NFR-05 | HTTPS enforced on all connections                                                    | Security      |
| NFR-06 | Input validation on both client and server                                           | Security      |
| NFR-07 | SQL injection protection via parameterized queries (Supabase client)                 | Security      |
| NFR-08 | XSS protection via React's default escaping + CSP headers                            | Security      |
| NFR-09 | Receipt uploads limited to 5MB, allowed types: JPG, PNG, PDF                         | Security      |
| NFR-10 | System supports up to 10,000 transactions per household without degradation          | Scalability   |
| NFR-11 | Database backups via Supabase automatic daily backups                                | Reliability   |
| NFR-12 | 99.9% uptime (Vercel + Supabase SLA)                                                 | Availability  |
| NFR-13 | All monetary amounts displayed with KES formatting (e.g., KES 1,500.00)              | UX            |
| NFR-14 | Dates displayed in DD/MM/YYYY format                                                 | UX            |
| NFR-15 | All CRUD operations provide success/error toast notifications                        | UX            |
| NFR-16 | Accessibility: WCAG 2.1 AA compliance (color contrast, keyboard nav, screen readers) | Accessibility |
| NFR-17 | Dark mode / Light mode toggle                                                        | UX            |

---

## 8. UI/UX Wireframe Descriptions

### 8.1 Page Map / Site Structure

```
├── / (redirect to /dashboard or /login)
├── /login
├── /register
├── /forgot-password
├── /dashboard
├── /transactions
│   ├── /transactions/new
│   └── /transactions/:id/edit
├── /budgets
├── /recurring
├── /savings
│   ├── /savings/new
│   └── /savings/:id
├── /debts
│   ├── /debts/new
│   └── /debts/:id
├── /reports
├── /bills
├── /import
├── /settings
│   ├── /settings/categories
│   ├── /settings/accounts
│   ├── /settings/users
│   └── /settings/profile
└── /notifications
```

### 8.2 Application Layout

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Logo | Navigation | 🔔 Notification Bell | 👤 │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ SIDEBAR  │           MAIN CONTENT AREA                  │
│  (nav)   │                                              │
│          │                                              │
│ □ Dashboard    │                                        │
│ □ Transactions │                                        │
│ □ Budgets      │                                        │
│ □ Recurring    │                                        │
│ □ Savings      │                                        │
│ □ Debts        │                                        │
│ □ Bills        │                                        │
│ □ Reports      │                                        │
│ □ Import       │                                        │
│ □ Settings     │                                        │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  FOOTER: © 2026 FamFin                                  │
└─────────────────────────────────────────────────────────┘

Responsive Behavior:
  • Mobile:  Sidebar → hamburger menu + bottom nav bar
  • Tablet:  Sidebar → icon-only rail
  • Desktop: Full sidebar with text labels
```

### 8.3 Dashboard Wireframe

```
┌────────────────────────────────────────────────────────┐
│  Good morning, [Name]!              [Month Selector ▼] │
├──────────┬──────────┬──────────┬──────────────────────┤
│ 💰 Total │ 💸 Total │ 📈 Net   │ 🎯 Budget           │
│  Income  │ Expenses │ Savings  │  Remaining           │
│ KES XX   │ KES XX   │ KES XX   │ KES XX               │
├──────────┴──────────┴──────────┴──────────────────────┤
│                                                        │
│ ┌─────────────────────┐  ┌───────────────────────────┐ │
│ │ Budget vs Actual    │  │ Income vs Expenses        │ │
│ │ (Progress Bars)     │  │ (Bar Chart)               │ │
│ │                     │  │                           │ │
│ │ 🟢 Groceries ████░  │  │  ██ Inc    ██ Exp        │ │
│ │ 🟡 Transport ███▓░  │  │                           │ │
│ │ 🔴 Entertain █████  │  │                           │ │
│ └─────────────────────┘  └───────────────────────────┘ │
│                                                        │
│ ┌─────────────────────┐  ┌───────────────────────────┐ │
│ │ Recent Transactions │  │ Upcoming Bills            │ │
│ │ ──────────────────  │  │ ────────────────────────  │ │
│ │ Groceries -KES 500  │  │ 🔴 Rent — 3 days         │ │
│ │ Salary  +KES 50,000 │  │ 🟡 KPLC — 7 days         │ │
│ │ [+ Add Transaction] │  │ 🟢 Internet — 15 days    │ │
│ └─────────────────────┘  └───────────────────────────┘ │
│                                                        │
│ ┌─────────────────────┐  ┌───────────────────────────┐ │
│ │ Savings Goals       │  │ Account Balances          │ │
│ │ ──────────────────  │  │ ────────────────────────  │ │
│ │ 🏖️ Vacation ████░ 60%│  │ 🏦 Joint: KES 120,000    │ │
│ │ 🚗 Car Fund ██░░░ 30%│  │ 📱 M-Pesa: KES 5,400    │ │
│ │                     │  │ 💵 Cash: KES 2,000       │ │
│ └─────────────────────┘  └───────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 9. API Specification

All routes are prefixed with `/api/`. Authentication required unless noted as Public.

### 9.1 Authentication

| Method | Endpoint                    | Description                   | Auth   | Role  |
| ------ | --------------------------- | ----------------------------- | ------ | ----- |
| POST   | `/api/auth/register`        | Register new user + household | Public | —     |
| POST   | `/api/auth/login`           | Login                         | Public | —     |
| POST   | `/api/auth/logout`          | Logout                        | Auth   | Any   |
| POST   | `/api/auth/forgot-password` | Request password reset        | Public | —     |
| POST   | `/api/auth/invite`          | Invite user to household      | Auth   | Admin |

### 9.2 Accounts

| Method | Endpoint            | Description        | Auth | Role  |
| ------ | ------------------- | ------------------ | ---- | ----- |
| GET    | `/api/accounts`     | List all accounts  | Auth | Any   |
| POST   | `/api/accounts`     | Create account     | Auth | Admin |
| PUT    | `/api/accounts/:id` | Update account     | Auth | Admin |
| DELETE | `/api/accounts/:id` | Deactivate account | Auth | Admin |

### 9.3 Categories

| Method | Endpoint              | Description                         | Auth | Role  |
| ------ | --------------------- | ----------------------------------- | ---- | ----- |
| GET    | `/api/categories`     | List all categories (with children) | Auth | Any   |
| POST   | `/api/categories`     | Create category                     | Auth | Admin |
| PUT    | `/api/categories/:id` | Update category                     | Auth | Admin |
| DELETE | `/api/categories/:id` | Deactivate category                 | Auth | Admin |

### 9.4 Transactions

| Method | Endpoint                           | Description                            | Auth | Role      |
| ------ | ---------------------------------- | -------------------------------------- | ---- | --------- |
| GET    | `/api/transactions`                | List (paginated, filterable, sortable) | Auth | Any       |
| POST   | `/api/transactions`                | Create transaction                     | Auth | Any       |
| PUT    | `/api/transactions/:id`            | Update transaction                     | Auth | Own/Admin |
| DELETE | `/api/transactions/:id`            | Delete transaction                     | Auth | Own/Admin |
| POST   | `/api/transactions/upload-receipt` | Upload receipt image                   | Auth | Any       |

### 9.5 Budgets

| Method | Endpoint                              | Description                   | Auth | Role  |
| ------ | ------------------------------------- | ----------------------------- | ---- | ----- |
| GET    | `/api/budgets?month=X&year=Y`         | Get budgets for month         | Auth | Any   |
| POST   | `/api/budgets`                        | Create/update category budget | Auth | Admin |
| GET    | `/api/budgets/overall?month=X&year=Y` | Get overall budget            | Auth | Any   |
| POST   | `/api/budgets/overall`                | Set overall budget            | Auth | Admin |
| POST   | `/api/budgets/copy`                   | Copy budgets to next month    | Auth | Admin |

### 9.6 Recurring Transactions

| Method | Endpoint                     | Description                  | Auth | Role  |
| ------ | ---------------------------- | ---------------------------- | ---- | ----- |
| GET    | `/api/recurring`             | List recurring rules         | Auth | Any   |
| POST   | `/api/recurring`             | Create rule                  | Auth | Admin |
| PUT    | `/api/recurring/:id`         | Update rule                  | Auth | Admin |
| DELETE | `/api/recurring/:id`         | Deactivate rule              | Auth | Admin |
| POST   | `/api/recurring/:id/confirm` | Confirm & create transaction | Auth | Any   |
| POST   | `/api/recurring/:id/skip`    | Skip this month              | Auth | Any   |

### 9.7 Savings Goals

| Method | Endpoint                         | Description        | Auth | Role  |
| ------ | -------------------------------- | ------------------ | ---- | ----- |
| GET    | `/api/savings`                   | List all goals     | Auth | Any   |
| POST   | `/api/savings`                   | Create goal        | Auth | Admin |
| PUT    | `/api/savings/:id`               | Update goal        | Auth | Admin |
| DELETE | `/api/savings/:id`               | Delete goal        | Auth | Admin |
| POST   | `/api/savings/:id/contribute`    | Add contribution   | Auth | Any   |
| GET    | `/api/savings/:id/contributions` | List contributions | Auth | Any   |

### 9.8 Debts

| Method | Endpoint                 | Description      | Auth | Role  |
| ------ | ------------------------ | ---------------- | ---- | ----- |
| GET    | `/api/debts`             | List all debts   | Auth | Any   |
| POST   | `/api/debts`             | Create debt      | Auth | Admin |
| PUT    | `/api/debts/:id`         | Update debt      | Auth | Admin |
| DELETE | `/api/debts/:id`         | Deactivate debt  | Auth | Admin |
| POST   | `/api/debts/:id/payment` | Log debt payment | Auth | Any   |

### 9.9 Bill Reminders

| Method | Endpoint         | Description             | Auth | Role  |
| ------ | ---------------- | ----------------------- | ---- | ----- |
| GET    | `/api/bills`     | List all bill reminders | Auth | Any   |
| POST   | `/api/bills`     | Create reminder         | Auth | Admin |
| PUT    | `/api/bills/:id` | Update reminder         | Auth | Admin |
| DELETE | `/api/bills/:id` | Deactivate reminder     | Auth | Admin |

### 9.10 Reports

| Method | Endpoint                                           | Description                    | Auth | Role |
| ------ | -------------------------------------------------- | ------------------------------ | ---- | ---- |
| GET    | `/api/reports/monthly-summary?month=X&year=Y`      | Monthly summary data           | Auth | Any  |
| GET    | `/api/reports/category-breakdown?month=X&year=Y`   | Category breakdown data        | Auth | Any  |
| GET    | `/api/reports/income-vs-expenses?months=12`        | Income vs expenses trend       | Auth | Any  |
| GET    | `/api/reports/net-worth?months=12`                 | Net worth over time            | Auth | Any  |
| GET    | `/api/reports/budget-vs-actual?month=X&year=Y`     | Budget vs actual comparison    | Auth | Any  |
| GET    | `/api/reports/spending-trends?months=6&category=X` | Spending by category over time | Auth | Any  |

### 9.11 Export & Import

| Method | Endpoint                         | Description                  | Auth | Role  |
| ------ | -------------------------------- | ---------------------------- | ---- | ----- |
| GET    | `/api/export/csv?from=X&to=Y`    | Export transactions as CSV   | Auth | Any   |
| GET    | `/api/export/pdf?month=X&year=Y` | Export monthly report as PDF | Auth | Any   |
| GET    | `/api/import/template`           | Download CSV template        | Auth | Admin |
| POST   | `/api/import/preview`            | Upload & preview CSV data    | Auth | Admin |
| POST   | `/api/import/confirm`            | Confirm & execute import     | Auth | Admin |

### 9.12 Notifications & Users

| Method | Endpoint                      | Description               | Auth | Role  |
| ------ | ----------------------------- | ------------------------- | ---- | ----- |
| GET    | `/api/notifications`          | List user notifications   | Auth | Any   |
| PUT    | `/api/notifications/:id/read` | Mark notification as read | Auth | Any   |
| PUT    | `/api/notifications/read-all` | Mark all as read          | Auth | Any   |
| GET    | `/api/users/me`               | Get current user profile  | Auth | Any   |
| PUT    | `/api/users/me`               | Update profile            | Auth | Any   |
| GET    | `/api/users`                  | List household members    | Auth | Admin |
| PUT    | `/api/users/:id/role`         | Change user role          | Auth | Admin |

---

## 10. MVP Scope & Phased Delivery

### 10.1 Phase 1 — MVP (Target: April–May 2026)

**Goal:** Replace Google Forms workflow with a fully functional budgeting app.

| Module         | Features Included                                                     |
| -------------- | --------------------------------------------------------------------- |
| Authentication | Register, Login, Logout, Password Reset                               |
| Household      | Auto-create on registration, invite 1 member                          |
| Accounts       | CRUD financial accounts (bank, M-Pesa, cash, credit card)             |
| Categories     | Pre-populated defaults + CRUD with sub-categories                     |
| Transactions   | Full CRUD, filtering, search, pagination, receipt upload              |
| Budgets        | Per-category + overall monthly budgets, progress bars, color warnings |
| Recurring      | CRUD rules, reminder notifications, confirm/skip flow                 |
| Savings Goals  | CRUD goals, contributions, progress tracking                          |
| Debt Tracking  | Mortgage tracking, payment logging, payoff projection                 |
| Bill Reminders | CRUD reminders, in-app + email notifications                          |
| Dashboard      | Full widget dashboard (8 widgets as specified)                        |
| Reports        | All 6 report types with interactive charts                            |
| Export         | CSV + PDF export                                                      |
| Import         | CSV import with template, preview, validation                         |
| Notifications  | In-app notification center + email alerts                             |
| Settings       | Profile, categories, accounts, user management                        |
| UX             | Responsive design, dark/light mode, PWA                               |

### 10.2 Phase 2 — Enhancements (Post-May 2026)

| Feature                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| Multi-currency         | Support multiple currencies with exchange rates    |
| Bank integration       | Plaid / M-Pesa API for auto-importing transactions |
| OCR receipts           | Extract data from receipt photos automatically     |
| Split expense balances | Running balance of who owes whom                   |
| Additional debt types  | Car loan, personal loan, credit card, student loan |
| Additional frequencies | Weekly, bi-weekly, quarterly, annually             |
| Native mobile apps     | React Native or Flutter for iOS & Android          |

### 10.3 Phase 3 — Small Business (Future)

| Feature          | Description                                     |
| ---------------- | ----------------------------------------------- |
| Multi-household  | User can belong to personal + business entities |
| Invoicing        | Basic invoice generation                        |
| Tax categories   | Tag expenses as tax-deductible                  |
| Business reports | Profit & Loss, Cash Flow Statement              |
| Additional roles | Accountant, Viewer roles                        |

---

## 11. Project Plan & Timeline

### 11.1 Sprint Plan (2-Week Sprints)

| Sprint       | Dates           | Deliverables                                                                                                                                               |
| ------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprint 0** | Feb 20 – Mar 2  | Project setup: Next.js scaffold, Supabase project, DB schema, auth setup, CI/CD pipeline, design system (Tailwind + shadcn/ui)                             |
| **Sprint 1** | Mar 3 – Mar 16  | Auth (register, login, logout, reset), Household creation, Account CRUD, Category CRUD with defaults + sub-categories, Settings pages                      |
| **Sprint 2** | Mar 17 – Mar 30 | Transaction CRUD (full form, filtering, search, pagination), Receipt upload, CSV Import (template, preview, confirm)                                       |
| **Sprint 3** | Mar 31 – Apr 13 | Budget management (per-category + overall), Budget tracking & alerts, Recurring transaction rules + confirm/skip flow, Bill reminders CRUD + notifications |
| **Sprint 4** | Apr 14 – Apr 27 | Savings goals (CRUD, contributions, progress), Debt tracking (mortgage, payments, payoff projection), Dashboard (all 8 widgets), Notification center       |
| **Sprint 5** | Apr 28 – May 11 | Reports (all 6 types with charts), CSV/PDF export, Dark/light mode, PWA config, Polish & bug fixes, User acceptance testing                                |

### 11.2 Milestones

| Milestone                   | Date         | Criteria                                                   |
| --------------------------- | ------------ | ---------------------------------------------------------- |
| **M1: Foundation**          | Mar 2, 2026  | Project running locally, DB schema deployed, auth working  |
| **M2: Core Data Entry**     | Mar 30, 2026 | Transactions, categories, accounts, CSV import all working |
| **M3: Budget Intelligence** | Apr 13, 2026 | Budgets, recurring, bill reminders, notifications working  |
| **M4: Goals & Dashboard**   | Apr 27, 2026 | Savings, debts, full dashboard operational                 |
| **M5: MVP Launch 🚀**       | May 11, 2026 | Reports, export, PWA complete, deployed to production      |

> 📌 **Timeline Note:** An alpha/beta with core features (transactions, budgets, dashboard) can be available by **mid-April**. The full polished MVP with all reports and exports targets **early-to-mid May 2026**.

---

## 12. Deployment Strategy

### 12.1 Environments

| Environment | Purpose                         | URL                                            |
| ----------- | ------------------------------- | ---------------------------------------------- |
| Local       | Development                     | `http://localhost:3000`                        |
| Preview     | PR reviews (Vercel auto-deploy) | `https://famfin-*-preview.vercel.app`          |
| Production  | Live app                        | `https://famfin.vercel.app` (or custom domain) |

### 12.2 Infrastructure (Free Tier)

| Service      | Tier         | Limits                                          |
| ------------ | ------------ | ----------------------------------------------- |
| **Vercel**   | Hobby (Free) | 100GB bandwidth, serverless functions, auto SSL |
| **Supabase** | Free         | 500MB DB, 1GB storage, 50k monthly active users |
| **Resend**   | Free         | 100 emails/day, 3,000 emails/month              |

### 12.3 CI/CD Pipeline

```
Developer pushes code to GitHub
        │
        ▼
   Vercel auto-detects push
        │
        ├── PR branch → Deploy to Preview URL (automatic)
        │
        └── main branch → Deploy to Production (automatic)
        │
        ▼
   Post-deploy: Run DB migrations (Supabase CLI)
```

### 12.4 Database Migrations

- Use Supabase CLI `supabase db push` for schema migrations
- Migration files stored in `/supabase/migrations/`
- Seed data (default categories) in `/supabase/seed.sql`

---

## 13. Risks & Mitigations

| #   | Risk                                                               | Probability | Impact   | Mitigation                                                                                |
| --- | ------------------------------------------------------------------ | ----------- | -------- | ----------------------------------------------------------------------------------------- |
| R1  | Supabase free tier storage limit (1GB) exceeded by receipt uploads | Medium      | Medium   | Compress images before upload (max 1MB), monitor usage, upgrade to Pro ($25/mo) if needed |
| R2  | Resend email limit (100/day) exceeded by notifications             | Low         | Low      | Batch notifications, implement digest emails, upgrade if needed                           |
| R3  | Vercel cold start causes slow API response                         | Low         | Low      | Keep functions small, use edge runtime where possible                                     |
| R4  | Timeline slippage due to complexity                                | Medium      | High     | Strict MVP scope, defer Phase 2 features, weekly progress reviews                         |
| R5  | PDF export complexity (charts in PDF)                              | Medium      | Medium   | Use @react-pdf/renderer or html-to-pdf library                                            |
| R6  | Data loss from accidental deletion                                 | Low         | High     | Soft delete pattern, Supabase daily backups, "undo" for delete actions                    |
| R7  | Unauthorized access to other household's data                      | Low         | Critical | Supabase Row Level Security (RLS) policies on every table, security testing               |

---

## 14. Appendices

### Appendix A: Default Categories (Pre-populated)

Based on current Google Forms categories, organized with parent-child hierarchy:

| Parent Category      | Sub-Categories                                                    | Type    |
| -------------------- | ----------------------------------------------------------------- | ------- |
| **Food & Groceries** | Household Goods, Fruit & Veg                                      | Expense |
| **Dining**           | Eating Out                                                        | Expense |
| **Housing**          | Rent, House Repairs, Hosting                                      | Expense |
| **Transport**        | Fuel, Car Maintenance                                             | Expense |
| **Utilities**        | _(standalone — add sub-cats: Water, Electricity, Internet later)_ | Expense |
| **Entertainment**    | _(standalone)_                                                    | Expense |
| **Healthcare**       | Medicine                                                          | Expense |
| **Children**         | Child Care, School Fees, School Supplies                          | Expense |
| **Sports**           | Sports Equipment                                                  | Expense |
| **Giving**           | EBC Giving                                                        | Expense |
| **Loans**            | Qona Loan Repayment, Stima Loan Repayment, Lending                | Expense |
| **Investment**       | _(standalone)_                                                    | Expense |
| **Salary**           | _(standalone)_                                                    | Income  |
| **Side Income**      | _(standalone)_                                                    | Income  |
| **Other Income**     | _(standalone)_                                                    | Income  |
| **Other**            | _(standalone)_                                                    | Both    |

### Appendix B: CSV Import Template

| date       | type    | amount | category         | sub_category    | account       | description     | merchant | payment_method | notes |
| ---------- | ------- | ------ | ---------------- | --------------- | ------------- | --------------- | -------- | -------------- | ----- |
| 15/01/2026 | expense | 2500   | Food & Groceries | Household Goods | Joint Account | Weekly shopping | Naivas   | mobile_money   |       |
| 01/01/2026 | income  | 150000 | Salary           |                 | Joint Account | January salary  | Employer | bank_transfer  |       |

### Appendix C: Notification Templates

| Event              | Channel        | Title                     | Message                                                                       |
| ------------------ | -------------- | ------------------------- | ----------------------------------------------------------------------------- |
| Budget 80%         | In-App + Email | ⚠️ Budget Warning         | "You've used 80% of your **{category}** budget (KES {spent} of KES {budget})" |
| Budget Exceeded    | In-App + Email | 🔴 Budget Exceeded        | "You've exceeded your **{category}** budget by KES {overage}"                 |
| Overall Budget 80% | In-App + Email | ⚠️ Overall Budget Warning | "You've used 80% of your overall monthly budget"                              |
| Bill Reminder      | In-App + Email | 📅 Bill Due Soon          | "**{bill_name}** (KES {amount}) is due in {days} days"                        |
| Recurring Due      | In-App + Email | 🔄 Recurring Transaction  | "**{description}** (KES {amount}) is due. Confirm or skip?"                   |
| Goal Milestone     | In-App         | 🎯 Goal Progress          | "You've reached {percent}% of your **{goal_name}** goal!"                     |

### Appendix D: Color Scheme & Design Tokens

| Element                | Light Mode | Dark Mode |
| ---------------------- | ---------- | --------- |
| Primary                | #2563EB    | #3B82F6   |
| Success / Under Budget | #16A34A    | #22C55E   |
| Warning / Near Budget  | #D97706    | #F59E0B   |
| Danger / Over Budget   | #DC2626    | #EF4444   |
| Background             | #FFFFFF    | #0F172A   |
| Surface                | #F8FAFC    | #1E293B   |
| Text Primary           | #0F172A    | #F1F5F9   |

---

## Document Sign-Off

By signing below, the client confirms that the requirements captured in this document are accurate and approves the commencement of development.

| Role                   | Name           | Signature | Date         |
| ---------------------- | -------------- | --------- | ------------ |
| Client (Product Owner) |                |           |              |
| Systems Analyst        | GitHub Copilot | _Digital_ | Feb 20, 2026 |

> ⚠️ **Open Items Requiring Confirmation:**
>
> 1. Are the categories and hierarchy correct? (Appendix A)
> 2. Is the role permission matrix accurate? (Section 4.2)
> 3. Is the dashboard layout what you envision? (Section 8.3)
> 4. Are you comfortable with the May timeline for full MVP?
> 5. Preferred app name? ("FamFin" is a placeholder)
> 6. Custom domain or `famfin.vercel.app` for MVP?

---

_FamFin Functional Specification v1.0 — Confidential_

_Prepared by GitHub Copilot (Systems Analyst) — February 20, 2026_
