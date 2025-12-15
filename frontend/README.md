# PhysioTrack AI - Frontend

React-based frontend for PhysioTrack AI with real-time pose detection using MediaPipe.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ExerciseSession. jsx
│   │   ├── SkeletonOverlay.jsx
│   │   ├── FeedbackPanel.jsx
│   │   ├── ProgressMetrics.jsx
│   │   └── ... 
│   ├── pages/           # Route pages
│   │   ├── Landing.jsx
│   │   ├── PatientDashboard.jsx
│   │   ├── ExercisePage.jsx
│   │   ├── PTDashboard.jsx
│   │   └── ...
│   ├── contexts/        # React Context for state
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── public/              # Static assets
└── package.json
```

## 🛠️ Technologies

- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **MediaPipe** - Pose detection (runs in browser!)
- **Axios** - API client
- **Recharts** - Data visualization
- **Three.js** - 3D graphics

## 🎨 Key Features

### Real-Time Pose Detection
- MediaPipe Pose runs entirely in the browser (no video uploaded!)
- 30+ FPS tracking
- 33 body landmarks detected

### Exercise Tracking
- Real-time form validation
- Instant corrective feedback
- Smart rep counting
- Quality scoring

### Analytics
- Progress charts (ROM trends)
- Session history
- Quality metrics

## 🔧 Available Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🌐 Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000
VITE_MEDIAPIPE_CDN=https://cdn.jsdelivr.net/npm/@mediapipe/pose
```

## 📱 Browser Support

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Note:** Camera access required.  HTTPS needed in production.

## 🐛 Common Issues

### Camera Not Working
- Ensure HTTPS in production
- Check browser permissions
- Try different browser

### MediaPipe Loading Slow
- First load downloads ML model (~6MB)
- Subsequent loads use browser cache

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

MIT