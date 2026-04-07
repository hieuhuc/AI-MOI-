import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db, collection, query, where, getDocs, deleteDoc, doc, updateDoc, Timestamp } from '../firebase';
import { Quiz } from '../types';
import { Plus, Trash2, Edit, BarChart3, Play, QrCode, ExternalLink, Clock, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';

export default function TeacherDashboard({ user }: { user: User }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, [user]);

  const fetchQuizzes = async () => {
    try {
      const q = query(collection(db, 'quizzes'), where('teacherId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const quizList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
      setQuizzes(quizList.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này?')) {
      try {
        await deleteDoc(doc(db, 'quizzes', id));
        setQuizzes(quizzes.filter(q => q.id !== id));
      } catch (error) {
        console.error('Error deleting quiz:', error);
      }
    }
  };

  const toggleStatus = async (quiz: Quiz) => {
    try {
      const newStatus = quiz.status === 'open' ? 'closed' : 'open';
      await updateDoc(doc(db, 'quizzes', quiz.id!), { status: newStatus });
      setQuizzes(quizzes.map(q => q.id === quiz.id ? { ...q, status: newStatus } : q));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý bài kiểm tra</h1>
          <p className="text-gray-500 mt-1">Chào mừng, {user.displayName}</p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo bài mới
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Chưa có bài kiểm tra nào</h3>
          <p className="text-gray-500 mb-6">Hãy bắt đầu bằng cách tạo bài kiểm tra đầu tiên của bạn.</p>
          <Link
            to="/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all"
          >
            Tạo bài ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <motion.div
              key={quiz.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    quiz.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {quiz.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/edit/${quiz.id}`)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(quiz.id!)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{quiz.title}</h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {quiz.duration} phút
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {quiz.questions.length} câu
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => toggleStatus(quiz)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      quiz.status === 'open' 
                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {quiz.status === 'open' ? <XCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {quiz.status === 'open' ? 'Đóng bài' : 'Mở bài'}
                  </button>
                  <Link
                    to={`/stats/${quiz.id}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Kết quả
                  </Link>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <button 
                  onClick={() => setShowQR(quiz.id!)}
                  className="text-gray-500 hover:text-indigo-600 text-sm font-medium flex items-center gap-1"
                >
                  <QrCode className="w-4 h-4" />
                  Mã QR
                </button>
                <a 
                  href={`/quiz/${quiz.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-indigo-600 text-sm font-medium flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Link bài
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <h3 className="text-xl font-bold mb-6">Mã QR bài kiểm tra</h3>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 inline-block mb-6">
                <QRCodeSVG value={`${window.location.origin}/quiz/${showQR}`} size={200} />
              </div>
              <p className="text-sm text-gray-500 mb-8 break-all">
                {window.location.origin}/quiz/{showQR}
              </p>
              <button
                onClick={() => setShowQR(null)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-colors"
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
