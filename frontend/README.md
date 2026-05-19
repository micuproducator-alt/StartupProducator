# 🚜 MiculProducator - Technical Specification

MiculProducator is a premium Romanian marketplace connecting local producers with communities and travelers.

---

## 🏗 Backend Architecture

The application follows a **BaaS (Backend as a Service)** architecture using **Supabase**. This allows for a serverless approach where the frontend communicates directly with the database and storage, protected by Row Level Security (RLS).

### Core Components:
1.  **Database (PostgreSQL)**: Managed by Supabase. Stores ads, reviews, and stats.
2.  **Storage**: Supabase Storage for hosting product images.
3.  **Edge Functions**: Serverless TypeScript functions for sensitive operations like Stripe payment processing.
4.  **Auth**: (Optional) Current implementation uses a **Token-based Management** system where sellers receive a unique URL with a secret token to manage their ads without needing a full account/password.

---

## 🗄 Database Field Glossary

If you are setting up the database, here is what each field in the `ads` table does:

| Field | Type | Purpose |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier for URLs and primary key. |
| `title` | TEXT | The name of the product/listing. |
| `price` | NUMERIC | Listing price in RON. |
| `categories` | TEXT[] | Array of categories for better filtering. |
| `token` | TEXT | **Security**: Secret key used to manage the ad without a password. |
| `location` | JSONB | Stores `{county, city, village}` for the route engine. |
| `status` | TEXT | `pending` (unpaid), `active` (live), `expired`. |
| `is_premium` | BOOL | If true, the ad is boosted to the top of results. |
| `images` | TEXT[] | Array of Public URLs from Supabase Storage. |
| `expires_at` | TZ | Automatic cleanup date for old ads. |
| `stats` | JSONB | Tracks `views`, `whatsappClicks`, and `favorites`. |
| `reviews` | JSONB | List of customer feedback and ratings. |

### Optional: Notifications Table
To enable real-time notifications (currently mocked), you can create a `notifications` table:
- `id`: UUID
- `title`: TEXT
- `message`: TEXT
- `ad_id`: UUID (Foreign Key to ads.id)
- `is_read`: BOOL
- `created_at`: TZ

## 🎯 MVP Features (Minimum Viable Product)

1.  **Ad Creation & Management**: Sellers can post ads with images and location data. Management is handled via unique tokens (no password required).
2.  **Public Marketplace**: Users can browse active ads, filter by category, and search by location (County/City).
3.  **Route Integration**: Integration with location data to help users find producers "on their way".
4.  **Monetization**: Paid plans for ad duration and "Premium" visibility.
5.  **Social Proof**: Rating and review system for each producer.
6.  **Analytics**: Basic tracking of views and WhatsApp contact clicks.

---

## ⚙️ Backend Modules & Business Logic

To fully implement the backend, you must build the following logic within Supabase (SQL, RLS, and Edge Functions):

### 1. Ad Lifecycle Module
-   **Logic: Status Transitions**:
    -   New ads start as `pending`.
    -   Upon successful payment, status moves to `active`.
    -   When `expires_at` < `now()`, status should be treated as `expired` (or hidden via RLS).
-   **Logic: Token-Based Security**:
    -   Every ad has a unique `token`.
    -   RLS policies must ensure `UPDATE` and `DELETE` operations only succeed if the `x-manage-token` header matches the ad's token.

### 2. Payment & Monetization Module (Edge Functions)
-   **Logic: Stripe Session Creation**:
    -   Validate `adId` exists.
    -   Map `planId` to Stripe Price IDs.
    -   Return a secure checkout URL.
-   **Logic: Webhook Processing**:
    -   Listen for `checkout.session.completed`.
    -   Extract `adId` from metadata.
    -   Update ad status to `active`.
    -   Calculate and set `expires_at` based on the purchased duration.
    -   Enable `is_premium` if the premium plan was selected.

### 3. Search & Discovery Module (SQL Logic)
-   **Logic: Location Filtering**:
    -   Perform efficient queries on the `location` JSONB field (specifically `county` and `city`).
-   **Logic: Category Filtering**:
    -   Handle array-based filtering for the `categories` field.
-   **Logic: Premium Boosting**:
    -   Ensure `is_premium = true` ads are always returned at the top of the results.

### 4. Social & Feedback Module
-   **Logic: Review Aggregation**:
    -   When a new review is added to the `reviews` JSONB array, the `rating` (average) must be recalculated.
    -   *Optimization*: Use a Database Trigger to update the `rating` column automatically whenever `reviews` changes.

### 5. Analytics Module
-   **Logic: Atomic Increments**:
    -   Create a RPC (Remote Procedure Call) function to increment `views` or `whatsappClicks` inside the `stats` JSONB object without overwriting other data.

### 6. Route Engine Module (Advanced)
-   **Logic: Path-Based Filtering**:
    -   Given a list of coordinates (the route), the backend should return producers whose `location` is within a certain radius (e.g., 10km) of any point on that route.
    -   *Implementation*: Use PostGIS (enabled via `CREATE EXTENSION postgis;`) for high-performance spatial queries if the `location` field is migrated to `GEOGRAPHY` types.

---

## 🔌 Connection & Integration

### 1. Frontend Configuration
The frontend connects to the backend via `src/services/supabaseClient.ts`. It looks for environment variables:
- `SUPABASE_URL`: Your project's API URL.
- `SUPABASE_ANON_KEY`: Your project's public API key.

These can be set in `.env.local` or directly in `index.html` for quick testing.

### 2. Backend Logic (Mock vs Real)
The `src/services/mockBackend.ts` acts as a bridge. 
- **Mock Mode**: If Supabase keys are missing, it uses `LocalStorage` to simulate a database.
- **Real Mode**: If keys are present, it uses the `@supabase/supabase-js` SDK to perform real CRUD operations.

### 3. Stripe Payments
Payments are handled via a Supabase Edge Function named `create-stripe-session`.
- **Frontend Call**: `supabase.functions.invoke('create-stripe-session', { body: { ... } })`
- **Backend Requirement**: The Edge Function must use the Stripe Node SDK to create a Checkout Session and return the URL.
- **Webhook**: Stripe should be configured to send a `checkout.session.completed` webhook back to a Supabase Edge Function to update the ad status to `active`.

---

## 🚀 Setup Instructions

### Step 1: Database Setup
Run the `backend_setup.sql` script in your Supabase SQL Editor. This will:
- Create the `ads` table.
- Enable RLS (Row Level Security).
- Set up security policies (e.g., public can read active ads, but only token-holders can edit).

### Step 2: Storage Setup
1. Go to **Storage** in your Supabase dashboard.
2. Create a new **Public Bucket** named `images`.
3. Ensure the bucket has a policy allowing public `SELECT` and authenticated/public `INSERT` (depending on your security preference).

### Step 3: Edge Functions (Optional for Payments)
If you want to enable real payments:
1. Install Supabase CLI.
2. Deploy the `create-stripe-session` function.
3. Set your `STRIPE_SECRET_KEY` in Supabase secrets: `supabase secrets set STRIPE_SECRET_KEY=sk_test_...`

### Step 4: Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 💻 How to Run Locally

To download and run this application on your local machine:

1.  **Download the Source**: Use the "Download" button in the AI Studio interface to get a ZIP file of the project.
2.  **Extract & Open**: Extract the files and open the folder in your code editor (e.g., VS Code).
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
5.  **Open in Browser**: Navigate to `http://localhost:3000`.

### Building for Production
To create a production-ready build:
```bash
npm run build
```
The output will be in the `dist/` directory.

---

## 🛠 Modules & Dependencies

### Frontend
- `react`: UI Framework.
- `lucide-react`: Iconography.
- `@supabase/supabase-js`: Official client for DB/Storage/Functions.
- `framer-motion`: Smooth UI transitions.

### Backend (Edge Functions)
- `stripe`: For processing payments.
- `cors`: To handle cross-origin requests from the frontend.
