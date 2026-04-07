import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db, doc, getDoc, setDoc, addDoc, collection, Timestamp, updateDoc } from '../firebase';
import { Quiz, Question } from '../types';
import { Plus, Trash2, Save, FileText, Sparkles, ArrowLeft, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function QuizCreator({ user }: { user: User }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(15);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuiz();
    }
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const docRef = doc(db, 'quizzes', id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Quiz;
        setTitle(data.title);
        setDuration(data.duration);
        setQuestions(data.questions);
        setIsEdit(true);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!title || questions.length === 0) {
      alert('Vui lòng nhập tiêu đề và ít nhất 1 câu hỏi.');
      return;
    }

    setLoading(true);
    try {
      const quizData = {
        title,
        duration,
        questions,
        status: 'open' as const,
        teacherId: user.uid,
        createdAt: isEdit ? undefined : Timestamp.now(),
      };

      if (isEdit) {
        await updateDoc(doc(db, 'quizzes', id!), quizData);
      } else {
        await addDoc(collection(db, 'quizzes'), quizData);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Lỗi khi lưu bài kiểm tra.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-word', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      // Basic parsing logic for Word text
      // This is a simplified version, real parsing would be more complex
      const text = data.text;
      const lines = text.split('\n').filter((l: string) => l.trim());
      const newQuestions: Question[] = [];
      
      let currentQ: Partial<Question> = {};
      lines.forEach((line: string) => {
        if (line.match(/^\d+\./) || line.match(/^Câu \d+:/)) {
          if (currentQ.question) newQuestions.push(currentQ as Question);
          currentQ = { question: line.replace(/^\d+\.|\s*Câu \d+:/, '').trim(), options: [], correctAnswer: 0 };
        } else if (line.match(/^[A-D]\./) || line.match(/^[A-D]\)/)) {
          currentQ.options?.push(line.replace(/^[A-D]\.|\s*[A-D]\)/, '').trim());
        }
      });
      if (currentQ.question) newQuestions.push(currentQ as Question);
      
      setQuestions([...questions, ...newQuestions]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Lỗi khi đọc file Word.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAiGenerate = async () => {
    if (!aiTopic) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, count: aiCount }),
      });
      const data = await res.json();
      setQuestions([...questions, ...data]);
      setShowAiModal(false);
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Lỗi khi tạo câu hỏi bằng AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu bài kiểm tra
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề bài kiểm tra</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài kiểm tra..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-lg font-medium"
            />
            
            <div className="mt-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Thời gian làm bài (phút)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-32 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Danh sách câu hỏi ({questions.length})</h2>
              <button
                onClick={addQuestion}
                className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Thêm câu hỏi
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group"
              >
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Câu hỏi {qIndex + 1}</label>
                  <textarea
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    placeholder="Nhập nội dung câu hỏi..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          q.correctAnswer === oIndex 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-200 text-transparent hover:border-green-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Phương án ${String.fromCharCode(65 + oIndex)}`}
                        className={`flex-grow px-4 py-2 rounded-xl border outline-none transition-all ${
                          q.correctAnswer === oIndex ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Nguồn dữ liệu</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowAiModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
              >
                <Sparkles className="w-5 h-5" />
                Tạo bằng AI
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-green-50 text-green-600 font-bold hover:bg-green-100 transition-all border border-green-100"
              >
                <FileText className="w-5 h-5" />
                Tải file Word
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".doc,.docx"
                className="hidden"
              />
            </div>

            <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex gap-2 text-orange-700 mb-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-bold">Lưu ý</span>
              </div>
              <p className="text-xs text-orange-600 leading-relaxed">
                Khi tải file Word, hãy đảm bảo định dạng câu hỏi rõ ràng (ví dụ: Câu 1: ..., A. ..., B. ...). Hệ thống sẽ tự động trích xuất các câu hỏi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Tạo câu hỏi bằng AI</h3>
                <button onClick={() => setShowAiModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chủ đề</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Ví dụ: Trí tuệ nhân tạo, Lập trình Python..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Số lượng câu hỏi</label>
                  <input
                    type="number"
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                
                <button
                  onClick={handleAiGenerate}
                  disabled={loading || !aiTopic}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Bắt đầu tạo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
