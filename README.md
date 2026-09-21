# My Daily Schedule

A comprehensive responsive web application for planning daily routines, tracking activities with an interactive checkbox checklist, building streaks, and maintaining consistency with Firebase Firestore and Gemini AI assistance.

---

## 1. Project Structure

```
├── .env.example
├── firebase-applet-config.json     # Provisioned Firebase app configuration
├── firestore.rules                 # Strict UID-scoped Firestore security rules
├── index.html                      # PWA entry point & metadata
├── metadata.json                   # App title and permissions
├── package.json                    # Dependencies and scripts
├── public/
│   ├── icon.svg                    # Vector app icon
│   └── manifest.json               # Web App Manifest (PWA compliant)
├── src/
│   ├── components/
│   │   ├── AIScheduleModal.tsx     # Gemini routine planner modal
│   │   ├── AuthModal.tsx           # Google & Email/Password Firebase auth
│   │   ├── CalendarView.tsx        # History selector & previous days' logs
│   │   ├── FoodTracker.tsx         # Breakfast, Lunch, Dinner, Snack logger
│   │   ├── MasterScheduleView.tsx  # Master recurring routine management
│   │   ├── Navigation.tsx          # Responsive navigation (header + mobile bar)
│   │   ├── ProgressHeader.tsx      # Greeting, progress %, bar, and streak badge
│   │   ├── ScanFoodPage.tsx        # Gemini Vision food image analyzer
│   │   ├── SettingsPage.tsx        # User targets, streak thresholds, and account
│   │   ├── TaskItem.tsx            # Touch-friendly checkbox, strikes, options
│   │   ├── TaskModal.tsx           # Add / Edit routine task form
│   │   ├── TodayChecklist.tsx      # Grouped Morning/Afternoon/Evening/Night list
│   │   ├── WaterTracker.tsx        # Water intake logger (+250, +500, +750, +1000ml)
│   │   └── WeeklyProgress.tsx      # Day-by-day weekly chart & completion rates
│   ├── context/
│   │   └── AuthContext.tsx         # Firebase Auth provider and user preferences
│   ├── services/
│   │   ├── firebase.ts             # Firebase app, auth, and firestore init
│   │   ├── geminiService.ts        # Gemini 2.5 Flash schedule & vision models
│   │   └── scheduleService.ts      # Real-time Firestore sync, tasks, streaks
│   ├── utils/
│   │   └── dateUtils.ts            # Date formatting, ISO conversions, groupings
│   ├── App.tsx                     # Main dashboard and tab router
│   ├── index.css                   # Tailwind CSS styling
│   ├── main.tsx                    # React root entry point
│   └── types.ts                    # TypeScript interface definitions
└── vite.config.ts                  # Vite build configuration
```

---

## 2. Firestore Database Architecture

Each user's data is isolated and secured using their authenticated Firebase `userId` (UID):

1. **`users/{userId}`**:
   - `displayName`: string
   - `targetCompletionRate`: number (default: 80%)
   - `waterTargetMl`: number (default: 2500 ml)

2. **`tasks/{taskId}`**:
   - `userId`: string
   - `title`: string (e.g., "Wake up", "Study Python")
   - `time`: string (24h format, e.g. "06:00", "18:00")
   - `category`: string ('Personal' | 'Study' | 'College' | 'Exercise' | 'Food' | 'Sleep' | 'Other')
   - `description`: string
   - `repeat`: 'daily' | 'weekdays' | 'weekends' | 'once'
   - `startDate`: string (YYYY-MM-DD)
   - `createdAt`: ISO timestamp
   - `reminder`: optional `{ enabled: boolean, type: 'push' | 'in-app' | 'both', minutesBefore: number, customTime?: string }`

3. **`dailyCompletions/{userId_date_taskId}`**:
   - `userId`: string
   - `taskId`: string
   - `date`: string (YYYY-MM-DD)
   - `completed`: boolean
   - `completedAt`: ISO timestamp
   *(Separating completion records allows recurring tasks to appear unchecked each new day without mutating the master task definition).*

4. **`waterLogs/{userId_date}`**:
   - `userId`: string
   - `date`: string (YYYY-MM-DD)
   - `amountMl`: number
   - `targetMl`: number
   - `updatedAt`: ISO timestamp

5. **`meals/{mealId}`**:
   - `userId`: string
   - `date`: string (YYYY-MM-DD)
   - `mealType`: 'breakfast' | 'lunch' | 'dinner' | 'snack'
   - `foodName`: string
   - `portion`: string
   - `calories`: number
   - `protein`: number
   - `carbs`: number
   - `fat`: number
   - `source`: 'manual' | 'ai-scan'

---

## 3. Firebase Security Rules

Deployed in `firestore.rules`:
- Users can only read, create, update, and delete their own documents (`request.auth.uid == resource.data.userId`).
- Unauthorized requests across users are blocked at the database engine level.

---

## 4. Gemini AI Integrations

1. **AI Schedule Assistant**:
   - User inputs a prompt (e.g. *"Create a daily schedule for me. I have college from 8 AM to 4 PM and I want 2 hours for studying."*).
   - Gemini (`gemini-2.5-flash`) generates a balanced chronological schedule with categories, times, and descriptions.
   - User can review, select/unselect items, and click **"Add All to My Schedule"** to batch-write them directly into Firestore.

2. **AI Food & Vision Scanner**:
   - User uploads or captures a meal photo.
   - Gemini Vision analyzes the image and returns estimated dish name, portion, calories, protein, carbs, and fat.
   - User can review and edit all fields before committing them to their daily meal log.

---

## 5. Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Ensure `GEMINI_API_KEY` is provided in `.env` (automatically injected by Google AI Studio secrets).

3. **Deploy Firebase Rules**:
   ```bash
   npm run build
   ```
   Rules were deployed using the automated deployment tool.

---

## 6. Run Commands

- **Development Server**:
  ```bash
  npm run dev
  ```
  Runs Vite on `http://localhost:3000`.

- **Type Check / Linter**:
  ```bash
  npm run lint
  ```

- **Production Build**:
  ```bash
  npm run build
  ```

- **Preview Build**:
  ```bash
  npm run preview
  ```

---

## 7. Deployment Instructions

1. Push your code or deploy directly via Google AI Studio's **Deploy to Cloud Run** button.
2. Ensure Firebase project ID `automatic-fire-system` has Firestore and Firebase Authentication enabled (Google and Email/Password providers).
3. The build output `dist/` is automatically served in production.
