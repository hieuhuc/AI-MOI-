import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, doc, getDoc } from '../firebase';
import { Quiz, Result } from '../types';
import { CheckCircle2, XCircle, Trophy, Home, ArrowRight, User, CreditCard, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export default function QuizResults() {
  const { id } = useParams();
  const [result, setResult] = useState<Result | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const resultSnap = await getDoc(doc(db, 'results', id!));
      if (resultSnap.exists()) {
        const resultData = resultSnap.data() as Result;
        setResult(resultData);
        
        const quizSnap = await getDoc(doc(db, 'quizzes', resultData.quizId));
        if (quizSnap.exists()) {
          setQuiz(quizSnap.data() as Quiz);
        }
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!result || !quiz) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy kết quả</h1>
        <Link to="/" className="text-indigo-600 font-bold">Quay lại trang chủ</Link>
      </div>
    );
  }

  const correctCount = result.answers.filter((ans, i) => ans === quiz.questions[i].correctAnswer).length;
  const wrongCount = quiz.questions.length - correctCount;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8"
      >
        <div className="bg-indigo-600 p-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Hoàn thành bài kiểm tra!</h1>
          <p className="text-indigo-100">{quiz.title}</p>
          
          <div className="mt-8 flex justify-center gap-12">
            <div className="text-center">
              <div className="text-4xl font-black mb-1">{result.score}</div>
              <div className="text-xs uppercase tracking-widest opacity-70">Điểm số</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black mb-1">{correctCount}/{quiz.questions.length}</div>
              <div className="text-xs uppercase tracking-widest opacity-70">Câu đúng</div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase">Sinh viên</div>
                <div className="font-bold text-gray-900">{result.studentName}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase">Mã số</div>
                <div className="font-bold text-gray-900">{result.studentCode}</div>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-6">Xem lại câu trả lời</h3>
          <div className="space-y-6">
            {quiz.questions.map((q, i) => {
              const isCorrect = result.answers[i] === q.correctAnswer;
              if (isCorrect) return null; // Chỉ hiển thị câu sai theo yêu cầu

              return (
                <div key={i} className="p-6 rounded-2xl border border-red-100 bg-red-50/30">
                  <div className="flex gap-3 mb-4">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-1" />
                    <h4 className="font-bold text-gray-900">{q.question}</h4>
                  </div>
                  
                  <div className="space-y-2 ml-8">
                    <div className="text-sm text-red-600 font-medium">
                      Câu trả lời của bạn: <span className="font-bold">{q.options[result.answers[i]] || 'Chưa trả lời'}</span>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      Đáp án đúng: <span className="font-bold">{q.options[q.correctAnswer]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {wrongCount === 0 && (
              <div className="text-center py-10 bg-green-50 rounded-2xl border border-green-100">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h4 className="font-bold text-green-800">Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi.</h4>
              </div>
            )}
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
            >
              <Home className="w-4 h-4" />
              Về trang chủ
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
