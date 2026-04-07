import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db, doc, getDoc, getDocs, collection, query, where } from '../firebase';
import { Quiz, Result } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowLeft, Download, Users, Trophy, Target, AlertCircle, Search, Filter, ChevronDown, FileSpreadsheet } from 'lucide-react';
import { motion } from 'motion/react';

export default function TeacherStats({ user }: { user: User }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const quizSnap = await getDoc(doc(db, 'quizzes', id!));
      if (quizSnap.exists()) {
        const quizData = quizSnap.data() as Quiz;
        if (quizData.teacherId !== user.uid) {
          alert('Bạn không có quyền xem kết quả này.');
          navigate('/dashboard');
          return;
        }
        setQuiz(quizData);

        const q = query(collection(db, 'results'), where('quizId', '==', id));
        const querySnapshot = await getDocs(q);
        const resultsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
        setResults(resultsList.sort((a, b) => b.submittedAt?.toMillis() - a.submittedAt?.toMillis()));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['STT', 'Họ tên', 'Mã sinh viên', 'Điểm số', 'Thời gian nộp'];
    const rows = results.map((r, i) => [
      i + 1,
      r.studentName,
      r.studentCode,
      r.score,
      r.submittedAt?.toDate().toLocaleString('vi-VN')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ket_qua_${quiz?.title}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate statistics
  const avgScore = results.length > 0 
    ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(2) 
    : 0;
  
  const passCount = results.filter(r => r.score >= 5).length;
  const failCount = results.length - passCount;

  // Score distribution for BarChart
  const distribution = [
    { range: '0-2', count: 0 },
    { range: '2-4', count: 0 },
    { range: '4-6', count: 0 },
    { range: '6-8', count: 0 },
    { range: '8-10', count: 0 },
  ];
  results.forEach(r => {
    if (r.score < 2) distribution[0].count++;
    else if (r.score < 4) distribution[1].count++;
    else if (r.score < 6) distribution[2].count++;
    else if (r.score < 8) distribution[3].count++;
    else distribution[4].count++;
  });

  // Pie chart data
  const pieData = [
    { name: 'Đạt (>=5)', value: passCount, color: '#4f46e5' },
    { name: 'Không đạt (<5)', value: failCount, color: '#ef4444' },
  ];

  // Most missed questions
  const questionStats = quiz?.questions.map((q, i) => {
    const wrongCount = results.filter(r => r.answers[i] !== q.correctAnswer).length;
    return { question: q.question, wrongCount, index: i + 1 };
  }).sort((a, b) => b.wrongCount - a.wrongCount).slice(0, 5);

  const filteredResults = results.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thống kê kết quả</h1>
            <p className="text-gray-500 mt-1">{quiz?.title}</p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          Xuất Excel (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-400 font-bold uppercase">Tổng số sinh viên</div>
              <div className="text-2xl font-black text-gray-900">{results.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-400 font-bold uppercase">Điểm trung bình</div>
              <div className="text-2xl font-black text-gray-900">{avgScore}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-400 font-bold uppercase">Tỷ lệ đạt</div>
              <div className="text-2xl font-black text-gray-900">
                {results.length > 0 ? ((passCount / results.length) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Phân bố điểm số</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Tỷ lệ đạt / không đạt</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-gray-900">Bảng tổng hợp kết quả</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên, mã sinh viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">STT</th>
                  <th className="px-6 py-4">Họ tên</th>
                  <th className="px-6 py-4">Mã sinh viên</th>
                  <th className="px-6 py-4">Điểm</th>
                  <th className="px-6 py-4">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResults.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{r.studentName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{r.studentCode}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        r.score >= 8 ? 'bg-green-100 text-green-700' :
                        r.score >= 5 ? 'bg-indigo-100 text-indigo-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {r.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {r.submittedAt?.toDate().toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Câu hỏi sai nhiều nhất
          </h3>
          <div className="space-y-6">
            {questionStats?.map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-700">Câu {stat.index}</span>
                  <span className="text-orange-600 font-bold">{stat.wrongCount} lượt sai</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 italic">"{stat.question}"</p>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full rounded-full" 
                    style={{ width: `${(stat.wrongCount / results.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {results.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-10">Chưa có dữ liệu thống kê</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
