import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase';
import { User } from 'firebase/auth';
import { LogIn, LogOut, Plus, BookOpen, BarChart3, Home as HomeIcon, QrCode, Trash2, Edit, Play, CheckCircle2, XCircle, Clock, Send, User as UserIcon, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import TeacherDashboard from './components/TeacherDashboard';
import QuizCreator from './components/QuizCreator';
import QuizPlayer from './components/QuizPlayer';
import QuizResults from './components/QuizResults';
import TeacherStats from './components/TeacherStats';

function Navbar({ user }: { user: User | null }) {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
              <GraduationCap className="w-8 h-8" />
              <span className="hidden sm:inline">AI Quiz Pro</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Quản lý</span>
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                  <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Giáo viên đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
        <p>Thiết kế và xây dựng: Trần Trung Hiếu</p>
        <p className="mt-1">&copy; 2026 AI Quiz Pro. All rights reserved.</p>
      </div>
    </footer>
  );
}

function Home() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl mb-6">
          Kiểm tra trắc nghiệm <span className="text-indigo-600">thông minh</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Hệ thống tạo và quản lý bài kiểm tra trắc nghiệm dành cho giáo dục đại học. 
          Tích hợp AI tạo đề tự động và hỗ trợ nhập liệu từ file Word.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Tạo đề nhanh</h3>
            <p className="text-gray-500 text-sm">Tạo đề bằng AI hoặc tải file Word lên hệ thống tự động trích xuất.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Chia sẻ dễ dàng</h3>
            <p className="text-gray-500 text-sm">Sinh mã QR và đường link riêng cho mỗi bài kiểm tra.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Thống kê chi tiết</h3>
            <p className="text-gray-500 text-sm">Tự động chấm điểm và báo cáo thống kê trực quan cho giáo viên.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
        <Navbar user={user} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={user ? <TeacherDashboard user={user} /> : <Home />} />
            <Route path="/create" element={user ? <QuizCreator user={user} /> : <Home />} />
            <Route path="/edit/:id" element={user ? <QuizCreator user={user} /> : <Home />} />
            <Route path="/stats/:id" element={user ? <TeacherStats user={user} /> : <Home />} />
            <Route path="/quiz/:id" element={<QuizPlayer />} />
            <Route path="/results/:id" element={<QuizResults />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
