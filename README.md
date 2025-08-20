# 🚀 Airtable Forms - Dynamic Form Builder

> **A full-stack MERN application that generates dynamic, customizable forms from Airtable bases with real-time validation and secure file uploads.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.17.1-green.svg)](https://mongodb.com/)
[![Express](https://img.shields.io/badge/Express-5.1.0-black.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

🔗 **Live Demo:** [https://airtable-forms.onrender.com](https://airtable-forms.onrender.com)

---

## ✨ Key Features

- **🔐 Secure OAuth Integration** – Seamless Airtable authentication with PKCE flow
- **📊 Dynamic Form Generation** – Automatically create forms from Airtable table schemas
- **🎯 Conditional Logic** – Show or hide fields dynamically based on user responses
- **📁 File Upload Support** – Cloudinary integration for secure file storage
- **⚡ Real-time Validation** – Client-side and server-side validation
- **🎨 Modern UI/UX** – Responsive design with Tailwind CSS
- **🔒 Session Management** – Secure session-based authentication
- **📱 Fully Responsive** – Optimized for desktop, tablet, and mobile devices

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React)       │◄──►│   (Express)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Form Builder  │    │ • REST API      │    │ • Airtable API  │
│ • Form Viewer   │    │ • OAuth Flow    │    │ • Cloudinary    │
│ • Dashboard     │    │ • Session Mgmt  │    │ • MongoDB       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🛠️ Tech Stack

**Frontend:**

- React 19.1.1 (Hooks & functional components)
- Vite (Fast build & dev server)
- Tailwind CSS (Utility-first styling)
- React Router (Client-side routing)
- Axios (HTTP client)

**Backend:**

- Node.js & Express.js 5.1.0
- MongoDB with Mongoose ODM
- Express Session with MongoDB store
- Multer (File uploads)
- Cloudinary (Cloud file storage)

**Authentication & Security:**

- OAuth 2.0 with PKCE for Airtable
- Session-based authentication with secure cookies
- CORS protection
- Environment variable configuration

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- Airtable account with API access
- Cloudinary account

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/airtable-forms.git
cd airtable-forms
```

2. **Install backend dependencies**

```bash
cd backend
npm install
```

3. **Install frontend dependencies**

```bash
cd ../frontend/airtable-forms-frontend
npm install
```

4. **Configure Environment Variables**

**Backend (.env)**

```env
NODE_ENV=development
PORT=5000
SECRET=your-session-secret
MONGO_URI_DEV=mongodb://localhost:27017/airtable-forms
MONGO_URI_PROD=your-production-mongodb-uri

# Airtable OAuth
AIRTABLE_CLIENT_ID=your-airtable-client-id
AIRTABLE_CLIENT_SECRET=your-airtable-client-secret
AIRTABLE_REDIRECT_URI=http://localhost:5000/api/auth/airtable/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Frontend (.env)**

```env
VITE_API_URL=http://localhost:5000
```

5. **Start the Application**

**Backend:**

```bash
cd backend
npm run dev
```

**Frontend:**

```bash
cd frontend/airtable-forms-frontend
npm run dev
```

6. **Access the Application**

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)

---

## 📖 Usage

### Authentication

- Click "Connect Airtable" to authorize your account
- Grant necessary permissions

### Form Builder

- Select an Airtable base and table
- Choose fields to include and configure conditional logic
- Set validation rules and required fields

### Form Deployment

- Generate a unique public URL for your form
- Share the link to collect responses

### Response Management

- View submissions in real-time
- Export data in multiple formats
- Monitor analytics and form performance

---

## 🔌 API Endpoints

**Authentication**

- `GET /api/auth/airtable/login` – Initiate OAuth flow
- `GET /api/auth/airtable/callback` – OAuth callback
- `GET /api/auth/airtable/me` – Get current user info

**Forms**

- `GET /api/forms` – List forms
- `POST /api/forms` – Create a form
- `GET /api/forms/:id` – Form details
- `PUT /api/forms/:id` – Update a form
- `DELETE /api/forms/:id` – Delete a form

**Airtable Integration**

- `GET /api/airtable/bases` – List accessible bases
- `GET /api/airtable/tables` – List tables in a base
- `GET /api/airtable/:baseId/:tableId/fields` – Get table schema

**Public Forms**

- `GET /api/forms/public/:slug` – Get public form
- `POST /api/forms/public/:slug/submit` – Submit response

---

## 🚀 Deployment

**Backend:** Deployed on Render: [https://airtable-forms.onrender.com](https://airtable-forms.onrender.com)

**Frontend:** Deploy via Vercel or Netlify

```bash
npm run build
# Deploy the dist/ folder
```

---

## 🔒 Security Features

- OAuth 2.0 PKCE
- Session-based authentication
- Server-side input validation
- Secure file uploads with Cloudinary
- CORS protection
- Environment variable configuration

---

## 📱 Responsive Design

Optimized for:

- Desktop
- Tablet
- Mobile devices

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Licensed under the ISC License – see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Portfolio: [Your Portfolio](https://yourportfolio.com)

---

## 🙏 Acknowledgments

- [Airtable](https://airtable.com/) – API integration
- [Cloudinary](https://cloudinary.com/) – File storage
- [Tailwind CSS](https://tailwindcss.com/) – UI components
- [MongoDB](https://mongodb.com/) – Database solution

---

## 📊 Project Status

- ✅ MVP Complete – Core functionality
- ✅ OAuth Integration – Airtable authentication
- ✅ Form Builder – Dynamic form creation
- ✅ File Uploads – Cloudinary integration
- 🔄 Testing – Unit & integration in progress
- 🔄 Documentation – API docs complete
- 🔄 Deployment – Production ready

---

⭐ **If you find this project useful, please give it a star!**
