# MediTrack AI Backend

AI-powered prescription and health report management system built with FastAPI.

## 🚀 Features

- **Prescription OCR**: Upload prescriptions and extract medicine details using AI
- **Medicine Tracking**: Track medicine schedules and adherence
- **Health Reports**: Upload and analyze health reports with AI insights
- **Smart Reminders**: SMS/WhatsApp notifications via Twilio
- **Health Timeline**: Chronological view of all health records

## 🛠️ Tech Stack

- **Framework**: FastAPI (Python 3.10+)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Firebase Storage / AWS S3 / Local
- **AI/ML**: OpenAI GPT-4 + Tesseract OCR
- **Notifications**: Twilio (SMS/WhatsApp)

## 📁 Project Structure

```
meditrack-backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Environment variables
│   ├── database.py          # Supabase connection
│   ├── models/              # Data models
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── schemas/             # Pydantic schemas
│   └── utils/               # Helper functions
├── requirements.txt
├── .env
└── README.md
```

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/meditrack-backend.git
cd meditrack-backend
```

### 2. Create virtual environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 5. Run the server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## 📖 API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🏗️ API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Prescriptions
- `POST /api/prescriptions/upload` - Upload & AI parse
- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions/{id}` - Get specific prescription
- `DELETE /api/prescriptions/{id}` - Delete prescription

### Medicines
- `GET /api/medicines` - Get medicine schedule
- `POST /api/medicines/{id}/mark-taken` - Mark as taken
- `POST /api/medicines/{id}/mark-missed` - Mark as missed
- `GET /api/medicines/adherence-stats` - Get adherence statistics

### Health Reports
- `POST /api/reports/upload` - Upload & AI analyze
- `GET /api/reports` - Get all reports
- `GET /api/reports/{id}` - Get specific report
- `GET /api/reports/{id}/trends` - Get trend data

### Notifications
- `POST /api/notifications/send-reminder` - Send reminder
- `GET /api/notifications/history` - Get notification history
- `PUT /api/notifications/settings` - Update settings

### Timeline
- `GET /api/timeline` - Get all records chronologically

## 🗄️ Database Schema

### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    phone VARCHAR,
    name VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Prescriptions
```sql
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    file_url VARCHAR,
    parsed_data JSONB,
    doctor_name VARCHAR,
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### Medicines
```sql
CREATE TABLE medicines (
    id UUID PRIMARY KEY,
    prescription_id UUID REFERENCES prescriptions(id),
    name VARCHAR NOT NULL,
    dosage VARCHAR,
    frequency VARCHAR,
    timing VARCHAR[],
    duration_days INT,
    start_date DATE,
    end_date DATE
);
```

### Medicine Logs
```sql
CREATE TABLE medicine_logs (
    id UUID PRIMARY KEY,
    medicine_id UUID REFERENCES medicines(id),
    scheduled_time TIMESTAMP,
    taken_at TIMESTAMP,
    status VARCHAR CHECK (status IN ('taken', 'missed', 'skipped')),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Health Reports
```sql
CREATE TABLE health_reports (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    file_url VARCHAR,
    report_type VARCHAR,
    lab_values JSONB,
    ai_summary TEXT,
    risk_level VARCHAR CHECK (risk_level IN ('normal', 'warning', 'critical')),
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment

### Render

1. Create `render.yaml` in project root
2. Connect your GitHub repository to Render
3. Add environment variables in Render dashboard
4. Deploy!

### Docker

```bash
docker build -t meditrack-backend .
docker run -p 8000:8000 meditrack-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

MediTrack AI Team
