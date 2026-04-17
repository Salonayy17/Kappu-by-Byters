# 🚀 KAPPU -- Insurance Platform for Gig Workers

## 📌 Overview

KAPPU is a **full-stack insurance platform designed specifically for gig
workers** (delivery agents, drivers, freelancers, etc.). It provides
accessible, flexible, and real-time insurance services tailored to
dynamic work environments.

The platform enables users to manage policies, file claims, receive
alerts, and detect fraudulent activities using intelligent logic and
real-time systems.

------------------------------------------------------------------------

## ✨ Key Features

-   🛡️ Insurance plans tailored for gig workers\
-   📄 Easy policy management\
-   🧾 Seamless claim submission & tracking\
-   🧠 Fraud detection using rule-based + ML logic\
-   🔔 Real-time alerts & notifications\
-   💳 Integrated payments (Razorpay / UPI)\
-   📊 Dashboard for insights & activity tracking\
-   📱 Progressive Web App (PWA) support\
-   🔐 Secure authentication system

------------------------------------------------------------------------

## 🛠️ Tech Stack

### 🎨 Frontend

-   HTML5\
-   CSS3\
-   JavaScript (Vanilla)\
-   PWA (Service Workers)

### ⚙️ Backend

-   Node.js\
-   Express.js

### 🗄️ Database

-   MongoDB\
-   Mongoose

### 🌐 APIs & Services

-   Payment APIs (Razorpay / UPI)\
-   External APIs (optional integrations)

### 🧠 AI / Logic Layer

-   Rule-based fraud detection\
-   Machine Learning (TensorFlow.js / Scikit-learn)

### ⚡ Real-Time & Background

-   Socket.IO\
-   Node Cron / setInterval\
-   Redis + Bull Queue

### 🔐 Security

-   JWT Authentication\
-   bcrypt\
-   Express Validator\
-   CORS

### 🚀 Dev & Deployment

-   Git & GitHub\
-   Postman\
-   Vercel (Frontend)\
-   Render / Railway / AWS (Backend)

------------------------------------------------------------------------

## 📂 Project Structure

    ├── backend/
    │   ├── config/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   ├── middlewares/
    │   ├── workers/
    │   └── server.js
    │
    ├── frontend/
    │   ├── public/
    │   ├── src/
    │   └── index.html
    │
    ├── .env
    ├── package.json
    └── README.md

------------------------------------------------------------------------

## 🚀 Running the Project Locally

### 📦 Prerequisites

-   Node.js (v16+)\
-   MongoDB\
-   Redis\
-   Git

------------------------------------------------------------------------

### 📥 1. Clone Repository

``` bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

------------------------------------------------------------------------

### 📦 2. Install Dependencies

#### Backend

``` bash
cd backend
npm install
```

#### Frontend

``` bash
cd ../frontend
npm install
```

------------------------------------------------------------------------

### ⚙️ 3. Environment Configuration

Create `.env` in backend:

PORT=5000\
MONGO_URI=your_mongodb_connection_string\
JWT_SECRET=your_secret_key

RAZORPAY_KEY_ID=your_key\
RAZORPAY_SECRET=your_secret

REDIS_URL=redis://127.0.0.1:6379

------------------------------------------------------------------------

### ▶️ 4. Run the Application

#### Start Backend

``` bash
cd backend
npm start
```

#### Start Frontend

``` bash
cd frontend
npm run dev
```

------------------------------------------------------------------------

### 🌐 Access URLs

-   Frontend → http://localhost:3000\
-   Backend → http://localhost:5000

------------------------------------------------------------------------

## 🧠 How It Works

1.  Users register and select insurance plans\
2.  Policies are stored and managed via backend services\
3.  Claims can be submitted and tracked\
4.  Fraud detection logic analyzes suspicious patterns\
5.  Real-time alerts are sent via Socket.IO\
6.  Payments are processed securely

------------------------------------------------------------------------

## 🔮 Future Enhancements

-   Personalized insurance recommendations\
-   Mobile app version\
-   Advanced ML fraud models\
-   Notification system (SMS/Email)\
-   Admin analytics dashboard

------------------------------------------------------------------------

## 🤝 Contributing

Fork the repo and submit a pull request.

------------------------------------------------------------------------

## 📜 License

MIT License
