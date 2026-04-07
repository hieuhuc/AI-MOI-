import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, addDoc, collection, Timestamp, query, where, getDocs } from '../firebase';
import { Quiz, Result } from '../types';
import { Clock, Send, User, CreditCard, AlertCircle, ChevronRight, ChevronLeft, GraduationCap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export default function QuizPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'info' | 'playing' | 'finished'>('info');
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const docRef = doc(db, 'quizzes', id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Quiz;
        if (data.status === 'closed') {
          alert('Bài kiểm tra này đã đóng.');
          navigate('/');
          return;
        }
        setQuiz(data);
        setAnswers(new Array(data.questions.length).fill(-1));
        setTimeLeft(data.duration * 60);
      } else {
        alert('Không tìm thấy bài kiểm tra.');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!studentName || !studentCode) {
      alert('Vui lòng nhập đầy đủ họ tên và mã sinh viên.');
      return;
    }

    // Check if student already submitted
    try {
      const q = query(
        collection(db, 'results'), 
        where('quizId', '==', id), 
        where('studentCode', '==', studentCode)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        alert('Bạn đã thực hiện bài kiểm tra này rồi. Mỗi sinh viên chỉ được làm bài 1 lần.');
        return;
      }
      setStep('playing');
    } catch (error) {
      console.error('Error checking existing results:', error);
      setStep('playing'); // Fallback to allow playing if check fails
    }
  };

  const handleSubmit = useCallback(async (isAuto = false) => {
    if (submitting) return;
    if (!isAuto && answers.includes(-1)) {
      alert('Vui lòng hoàn thành tất cả các câu hỏi trước khi nộp bài.');
      return;
    }

    setSubmitting(true);
    try {
      let score = 0;
      quiz!.questions.forEach((q, i) => {
        if (answers[i] === q.correctAnswer) {
          score += 10 / quiz!.questions.length;
        }
      });

      const resultData: Result = {
        quizId: id!,
        studentName,
        studentCode,
        score: parseFloat(score.toFixed(2)),
        answers,
        submittedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'results'), resultData);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      navigate(`/results/${docRef.id}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Lỗi khi nộp bài.');
    } finally {
      setSubmitting(false);
    }
  }, [quiz, answers, studentName, studentCode, id, navigate, submitting]);

  useEffect(() => {
    if (step === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (step === 'info') {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz?.title}</h1>
            <p className="text-gray-500 mt-2">Vui lòng nhập thông tin để bắt đầu</p>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Họ và tên
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Mã sinh viên
              </label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="SV123456"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-8">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-1">
              <Clock className="w-4 h-4" /> Thời gian làm bài: {quiz?.duration} phút
            </div>
            <p className="text-xs text-indigo-600">Hệ thống sẽ tự động nộp bài khi hết thời gian.</p>
          </div>

          <button
            onClick={startQuiz}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all"
          >
            Bắt đầu kiểm tra
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQ = quiz!.questions[currentQuestion];
  const isAllAnswered = !answers.includes(-1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-20 bg-gray-50/80 backdrop-blur-sm py-4 z-40">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
            timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-gray-700 shadow-sm'
          }`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm font-bold text-gray-500">
            Câu {currentQuestion + 1} / {quiz!.questions.length}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAllAnswered && (
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-100 transition-all"
            >
              <Send className="w-4 h-4" />
              Nộp bài sớm
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-8 leading-relaxed">
                {currentQ.question}
              </h2>

              <div className="space-y-4 mt-auto">
                {currentQ.options.map((opt, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() => {
                      const newAnswers = [...answers];
                      newAnswers[currentQuestion] = oIndex;
                      setAnswers(newAnswers);
                    }}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                      answers[currentQuestion] === oIndex
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-gray-100 hover:border-indigo-100 text-gray-600'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                      answers[currentQuestion] === oIndex ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-xl shadow-sm border border-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
              Câu trước
            </button>
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(quiz!.questions.length - 1, prev + 1))}
              disabled={currentQuestion === quiz!.questions.length - 1}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-xl shadow-sm border border-gray-100 disabled:opacity-30"
            >
              Câu sau
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-40">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Tiến độ
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {answers.map((ans, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQuestion(i)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    currentQuestion === i
                      ? 'ring-2 ring-indigo-600 ring-offset-2'
                      : ''
                  } ${
                    ans !== -1
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {!isAllAnswered && (
              <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-700 leading-tight">
                  Hãy trả lời tất cả các câu hỏi để có thể nộp bài sớm.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
