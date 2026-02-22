import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderLock, 
  Search, 
  History, 
  BrainCircuit, 
  MoreVertical, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  ChevronRight,
  Clock,
  Target,
  Send,
  MessageSquare,
  Users,
  Hash,
  Phone,
  Video,
  LayoutGrid,
  Plus,
  Smile,
  Scissors,
  Folder,
  Image as ImageIcon,
  Mail,
  Mic,
  Bot,
  ChevronDown,
  FileBox,
  BookOpen,
  Upload,
  Layers,
  X,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchFiles, generateMicroTasks } from './services/gemini';
import Mermaid from './components/Mermaid';

type FileItem = {
  id: string;
  name: string;
  group_name: string;
  version_chain_id: string;
  is_final: number;
  upload_date: string;
  content_snippet: string;
  page_count: number;
  weight: number;
  sender: string;
  priority: string;
};

type EvidenceResult = {
  fileName: string;
  page: number;
  snippet: string;
  sender: string;
  priority: string;
  fullContent: string;
  type: 'pdf' | 'image';
  imageUrl?: string;
};

type SearchResult = {
  fileId: string;
  fileName: string;
  snippet: string;
  pageNumber: number;
};

type Quiz = {
  question: string;
  type: string;
  options?: string[];
  answer: string;
  evidencePage: number;
};

type Message = {
  id: string;
  sender: 'bot' | 'user';
  content?: React.ReactNode;
  type?: 'text' | 'quiz';
  quizData?: QuizItem[];
  time?: string;
};

type QuizItem = {
  id: number;
  type: 'choice' | 'boolean' | 'fill';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
};

const InteractiveQuizMessage = ({ questions, onComplete }: { questions: QuizItem[], onComplete: (results: { qId: number, isCorrect: boolean }[]) => void }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const handleSelect = (qId: number, answer: string) => {
    if (submitted[qId]) return;
    const newAnswers = { ...answers, [qId]: answer };
    const newSubmitted = { ...submitted, [qId]: true };
    setAnswers(newAnswers);
    setSubmitted(newSubmitted);
    
    checkCompletion(newAnswers, newSubmitted);
  };

  const handleFillSubmit = (qId: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value;
      if (!val.trim() || submitted[qId]) return;
      const newAnswers = { ...answers, [qId]: val };
      const newSubmitted = { ...submitted, [qId]: true };
      setAnswers(newAnswers);
      setSubmitted(newSubmitted);
      
      checkCompletion(newAnswers, newSubmitted);
    }
  };

  const checkCompletion = (currentAnswers: Record<number, string>, currentSubmitted: Record<number, boolean>) => {
    if (Object.keys(currentSubmitted).length === questions.length) {
      const results = questions.map(q => ({
        qId: q.id,
        isCorrect: currentAnswers[q.id] === q.correctAnswer
      }));
      // 延迟一下，让用户看到最后一题的反馈
      setTimeout(() => onComplete(results), 1000);
    }
  };

  return (
    <div className="quiz-message-container">
      <p className="mb-2 font-bold">已为您生成今日微任务（3题）：</p>
      <div className="space-y-3">
        {questions.map((q, idx) => {
          const isCorrect = answers[q.id] === q.correctAnswer;
          const isSubmitted = submitted[q.id];
          
          return (
            <div key={q.id} className={`p-3 rounded border transition-colors ${
              isSubmitted 
                ? (isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200') 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex justify-between items-start mb-1">
                <p className="font-bold text-qq-blue text-xs">题目 {idx + 1} ({q.type === 'choice' ? '单选' : q.type === 'boolean' ? '判断' : '填空'})</p>
                {isSubmitted && (
                  <span className={`text-xs font-bold ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isCorrect ? '回答正确' : '回答错误'}
                  </span>
                )}
              </div>
              <p className="mb-2 text-sm">{q.question}</p>
              
              {q.type === 'choice' && (
                <div className="space-y-1">
                  {q.options?.map((opt, i) => {
                    const isSelected = answers[q.id] === opt;
                    let btnClass = "block w-full text-left px-2 py-1 rounded text-xs transition-colors ";
                    if (isSubmitted) {
                      if (opt === q.correctAnswer) btnClass += "bg-emerald-200 text-emerald-800 font-medium";
                      else if (isSelected) btnClass += "bg-red-200 text-red-800";
                      else btnClass += "opacity-50";
                    } else {
                      btnClass += "hover:bg-gray-200 bg-white border border-gray-200";
                    }
                    
                    return (
                      <button 
                        key={i} 
                        onClick={() => handleSelect(q.id, opt)}
                        disabled={isSubmitted}
                        className={btnClass}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'boolean' && (
                <div className="flex space-x-2">
                  {['True', 'False'].map((opt) => {
                    const isSelected = answers[q.id] === opt;
                    let btnClass = "flex-1 px-2 py-1 rounded text-xs transition-colors border ";
                    if (isSubmitted) {
                      if (opt === q.correctAnswer) btnClass += "bg-emerald-200 text-emerald-800 border-emerald-300 font-medium";
                      else if (isSelected) btnClass += "bg-red-200 text-red-800 border-red-300";
                      else btnClass += "bg-gray-100 text-gray-400 border-gray-200";
                    } else {
                      btnClass += "bg-white border-gray-300 hover:bg-gray-50";
                    }

                    return (
                      <button 
                        key={opt} 
                        onClick={() => handleSelect(q.id, opt)}
                        disabled={isSubmitted}
                        className={btnClass}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'fill' && (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={isSubmitted ? answers[q.id] : "输入答案并回车"} 
                    disabled={isSubmitted}
                    onKeyDown={(e) => handleFillSubmit(q.id, e)}
                    className={`w-full px-2 py-1 border rounded text-xs focus:outline-none ${
                      isSubmitted 
                        ? (isCorrect ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-red-500 text-red-700 bg-red-50')
                        : 'border-gray-300 focus:border-qq-blue'
                    }`} 
                  />
                  {!isSubmitted && <Send size={12} className="absolute right-2 top-2 text-gray-400" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'chat' | 'manager' | 'explanation'>('chat');
  const [activeChat, setActiveChat] = useState<'english' | 'dorm' | 'manager_bot'>('english');
  const [activeTab, setActiveTab] = useState<'locker' | 'tasks' | 'review_plan'>('locker');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [evidenceSearchQuery, setEvidenceSearchQuery] = useState('');
  const [isEvidenceSearching, setIsEvidenceSearching] = useState(false);
  const [evidenceResult, setEvidenceResult] = useState<EvidenceResult | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<EvidenceResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [microTasks, setMicroTasks] = useState<Quiz[]>([]);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [explanationData, setExplanationData] = useState<QuizItem[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pushTime, setPushTime] = useState('09:00');
  const [wrongQuestions, setWrongQuestions] = useState<QuizItem[]>([]);
  const [showWrongQuestionsModal, setShowWrongQuestionsModal] = useState(false);

  // AI Assistant State
  const [assistantMessages, setAssistantMessages] = useState<Message[]>([
    { id: 'ai-init', sender: 'bot', type: 'text', content: '你好！我是你的AI学习小助手，有什么可以帮你的吗？', time: '刚刚' }
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const assistantEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'tasks' && assistantEndRef.current) {
      assistantEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assistantMessages, activeTab]);

  const handleAssistantSend = () => {
    if (!assistantInput.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'text',
      content: assistantInput,
      time: '刚刚'
    };
    setAssistantMessages(prev => [...prev, newMsg]);
    const currentInput = assistantInput;
    setAssistantInput('');

    // Demo response
    if (currentInput.includes('四级作文') && currentInput.includes('要点')) {
      setTimeout(() => {
        setAssistantMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'bot',
          type: 'text',
          content: (
            <div className="space-y-2">
              <p className="font-bold">四级作文高分要点总结：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-bold">结构清晰：</span>采用“三段式”结构（提出问题/观点 -&gt; 分析原因/举例论证 -&gt; 总结/提出建议）。</li>
                <li><span className="font-bold">词汇升级：</span>使用高级词汇替换基础词汇（如用 "exceedingly" 替换 "very"，"beneficial" 替换 "good"）。</li>
                <li><span className="font-bold">句式多样：</span>灵活运用倒装句、强调句、从句（定语从句、状语从句）以及非谓语动词。</li>
                <li><span className="font-bold">逻辑连贯：</span>恰当使用连接词（However, Therefore, Furthermore, In addition）使文章行文流畅。</li>
                <li><span className="font-bold">卷面整洁：</span>书写工整，避免涂改，给阅卷老师留下良好印象。</li>
              </ul>
            </div>
          ),
          time: '刚刚'
        }]);
      }, 1000);
    } else {
       // Generic response for other inputs
       setTimeout(() => {
        setAssistantMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'bot',
          type: 'text',
          content: '收到！这是一个很好的问题，但我目前只能演示“四级作文高分要点”相关的内容。',
          time: '刚刚'
        }]);
      }, 1000);
    }
  };

  const [managerMessages, setManagerMessages] = useState<Message[]>([]);

  useEffect(() => {
    setManagerMessages([
      {
        id: 'init-1',
        sender: 'bot',
        type: 'text',
        content: (
          <>
            <div>您好！我是您的专属学习资料管家，有什么可以帮您？</div>
            <div className="flex space-x-2 mt-2">
              <button 
                onClick={() => setShowTimePicker(true)}
                className="bg-qq-blue text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
              >
                推送时间
              </button>
              <button 
                onClick={() => setShowWrongQuestionsModal(true)}
                className="bg-gray-200 text-qq-text px-4 py-2 rounded-lg text-sm hover:bg-gray-300"
              >
                错题集
              </button>
            </div>
          </>
        ),
        time: '在线'
      }
    ]);
  }, []);
  
  // Review Plan State
  const [targetDate, setTargetDate] = useState('');
  const [subject, setSubject] = useState('英语四级');
  const [userLevel, setUserLevel] = useState<'新手' | '中等' | '强化'>('中等');
  const [dailyReviewTime, setDailyReviewTime] = useState(30);
  const [reviewPlan, setReviewPlan] = useState<{
    days: number;
    tasks: { phase: string; description: string; materials: string[]; estimatedTime: string; }[];
  } | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'choice' | 'group_list' | 'group_files'>('choice');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (view === 'manager') {
      fetchFiles();
    }
  }, [view, activeChat]);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const groupName = activeChat === 'english' ? '2025级本科生英语课通知群' : activeChat === 'dorm' ? '309宿舍小分队' : undefined;
      const url = groupName ? `/api/files?group_name=${encodeURIComponent(groupName)}` : '/api/files';
      console.log(`[fetchFiles] activeChat: ${activeChat}, Generated URL: ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      // Fallback mock data for Vercel/Preview environment where backend might not be available
      const mockFiles: FileItem[] = [
        { id: '1', name: '2026四级词汇大纲_校对版.pdf', group_name: '2025级本科生英语课通知群', version_chain_id: 'v1', is_final: 1, upload_date: '2025-10-10', content_snippet: '...', page_count: 12, weight: 1, sender: 'Teacher', priority: 'high' },
        { id: '2', name: '四级作文万能模板汇总.pdf', group_name: '2025级本科生英语课通知群', version_chain_id: 'v2', is_final: 1, upload_date: '2025-10-12', content_snippet: '...', page_count: 5, weight: 1, sender: 'Teacher', priority: 'medium' },
        { id: '3', name: '四级真题必刷题.pdf', group_name: '2025级本科生英语课通知群', version_chain_id: 'v3', is_final: 0, upload_date: '2025-10-15', content_snippet: '...', page_count: 20, weight: 1, sender: 'Student', priority: 'low' },
        { id: '4', name: '宿舍卫生值日表.xlsx', group_name: '309宿舍小分队', version_chain_id: 'v4', is_final: 1, upload_date: '2025-09-01', content_snippet: '...', page_count: 1, weight: 1, sender: 'Roommate', priority: 'high' },
        { id: '5', name: '周末聚餐菜单.docx', group_name: '309宿舍小分队', version_chain_id: 'v5', is_final: 0, upload_date: '2025-10-20', content_snippet: '...', page_count: 2, weight: 1, sender: 'Me', priority: 'low' }
      ];
      
      const groupName = activeChat === 'english' ? '2025级本科生英语课通知群' : activeChat === 'dorm' ? '309宿舍小分队' : undefined;
      if (groupName) {
        setFiles(mockFiles.filter(f => f.group_name === groupName));
      } else {
        setFiles(mockFiles);
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSetFinal = async (file: FileItem) => {
    await fetch('/api/files/set-final', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: file.id, version_chain_id: file.version_chain_id })
    });
    fetchFiles();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/files/${id}`, { method: 'DELETE' });
    fetchFiles();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchFiles(searchQuery, files);
      setSearchResults(results);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEvidenceSearch = () => {
    if (!evidenceSearchQuery.trim()) return;
    setIsEvidenceSearching(true);
    
    // Mocking evidence search logic based on provided PDF content
    setTimeout(() => {
      const query = evidenceSearchQuery.toLowerCase();
      if (query.includes('作文') || query.includes('开头') || query.includes('nowadays')) {
        setEvidenceResult({
          fileName: '四级作文万能模板汇总.pdf',
          page: 1,
          sender: '王老师',
          priority: '高优先级',
          type: 'pdf',
          snippet: '...在四级作文开头段落中，可以使用以下万能句型：Nowadays, there is a growing concern over the issue of [主题]...',
          fullContent: `一、 四级作文评分标准与大纲概览\n字数要求：120-150 词。\n评分维度：切题、语言连贯、结构清晰、用词准确。\n高频主题：校园生活、科技影响、传统文化、职业规划。\n\n二、开头段落万能句型（核心演示区）\n在四级作文开头段落中，可以使用以下万能句型：\n现象描述法：\n"Nowadays, there is a growing concern over the issue of [主题]." (如今，人们越来越关注[主题]的问题。) \n"With the rapid development of technology, [主题] has become a part of our daily life." (随着科技的飞速发展，[主题]已成为我们日常生活的一部分。)\n引出不同观点：\n"When it comes to [主题], people's opinions vary from person to person." (涉及到[主题]时，人们的观点因人而异。) \n"There is a widespread controversy over whether [主题] is beneficial or harmful." (关于[主题]是有益还是有害，存在着广泛的争议。)\n\n三、中间段落与衔接词\n为了使文章逻辑严密，建议使用以下过渡词：\n表示递进：Furthermore, Moreover, In addition. \n表示转折：However, On the contrary, Nevertheless. \n列举原因：First and foremost, Secondly, Last but not least.\n\n四、 结尾段落（总结与呼吁）\n得出结论：\n"From what has been discussed above, we may safely draw the conclusion that..." (综上所述，我们可以得出结论...)`
        });
      } else if (query.includes('however') || query.includes('转折')) {
        setEvidenceResult({
          fileName: '四级作文万能模板汇总.pdf',
          page: 1,
          sender: '王老师',
          priority: '高优先级',
          type: 'pdf',
          snippet: '...为了使文章逻辑严密，建议使用以下过渡词：表示转折：However, On the contrary, Nevertheless...',
          fullContent: `三、中间段落与衔接词\n为了使文章逻辑严密，建议使用以下过渡词：\n表示递进：Furthermore, Moreover, In addition. \n表示转折：However, On the contrary, Nevertheless. \n列举原因：First and foremost, Secondly, Last but not least.\n\n证据化片段演示提示：当用户搜索 "However" 时，管家应定位至此页，并显示前后 50 字原文 。`
        });
      } else if (query.includes('建议') || query.includes('measures')) {
        setEvidenceResult({
          fileName: '四级作文万能模板汇总.pdf',
          page: 2,
          sender: '王老师',
          priority: '高优先级',
          type: 'pdf',
          snippet: '...给出建议："It is high time that we took some effective measures to solve this problem."...',
          fullContent: `给出建议：\n"It is high time that we took some effective measures to solve this problem." (是我们采取有效措施解决这个问题的时候了。)`
        });
      } else if (query.includes('环境') || query.includes('environment')) {
        setEvidenceResult({
          fileName: '环境保护词汇思维导图.png',
          page: 1,
          sender: '王老师',
          priority: '高优先级',
          type: 'image',
          imageUrl: 'https://picsum.photos/seed/environment/1200/800',
          snippet: '...思维导图中心词：ENVIRONMENT。包含：POLLUTION (Acid rain, Carbon dioxide, Sewage), ACTION (Sort trash, Renewable energy), CLIMATE (Greenhouse effect, Melting glaciers)...',
          fullContent: `[思维导图内容解析]\n中心主题：ENVIRONMENT (环境)\n\n分支 1：POLLUTION (污染)\n- Acid rain (酸雨)\n- Carbon dioxide (二氧化碳)\n- Sewage (污水)\n\n分支 2：ACTION (行动)\n- Sort trash (垃圾分类)\n- Renewable energy (可再生能源)\n\n分支 3：CLIMATE (气候)\n- Greenhouse effect (温室效应)\n- Melting glaciers (冰川融化)`
        });
      } else {
        setEvidenceResult(null);
      }
      setIsEvidenceSearching(false);
    }, 800);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-qq-text rounded px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleGenerateQuiz = async (file: FileItem) => {
    setIsGeneratingQuiz(true);
    setActiveTab('tasks');
    setView('manager');
    try {
      const tasks = await generateMicroTasks(file.content_snippet, file.name);
      setQuizzes(tasks);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: file.name,
        group_name: '本地上传',
        page_count: Math.floor(Math.random() * 50) + 1,
        content_snippet: `这是从本地上传的文件 "${file.name}" 的模拟内容片段...`,
        sender: '我',
        priority: '中优先级'
      })
    });

    if (res.ok) {
      fetchFiles();
      setShowImportModal(false);
      setImportStep('choice');
    }
  };

  const handleImportFromGroup = async (fileName: string) => {
    const currentGroupName = activeChat === 'english' ? '2025级本科生英语课通知群' : '309宿舍小分队';
    const res = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fileName,
        group_name: currentGroupName,
        page_count: fileName.includes('照片') ? 0 : Math.floor(Math.random() * 30) + 5,
        content_snippet: `这是从群聊 "309宿舍小分队" 导入到 "${currentGroupName}" 的文件 "${fileName}" 的内容...`,
        sender: fileName.includes('电费') || fileName.includes('照片') ? '张三' : '李盈盈',
        priority: fileName.includes('真题') || fileName.includes('期末') ? '高优先级' : '中优先级'
      })
    });

    if (res.ok) {
      fetchFiles();
      setShowImportModal(false);
      setImportStep('choice');
      setToastMessage(`已成功导入: ${fileName}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const mockGroupFiles = [
    { name: '四级真题必刷题.pdf', date: '2024-02-21' },
    { name: '宿舍电费分摊_2025.pdf', date: '2024-02-15' },
    { name: '期末考试划重点_计算机网络.pdf', date: '2024-02-20' },
    { name: '宿舍照片合集.zip', date: '2024-02-18' },
    { name: '毕业论文初稿_张三.docx', date: '2024-02-21' },
  ];

  const generateReviewPlan = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      setToastMessage('目标日期必须在未来');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Dynamic task generation logic
    let tasks = [];
    
    // Find relevant materials from the archive
    const relevantFiles = files.filter(f => 
      f.name.includes(subject) || 
      (subject.includes('英语') && (f.name.includes('四级') || f.name.includes('CET'))) ||
      (subject.includes('数学') && (f.name.includes('高数') || f.name.includes('数学'))) ||
      (subject.includes('计算机') && (f.name.includes('计') || f.name.includes('网络')))
    ).map(f => f.name);

    const getMaterials = (count: number, fallback: string[]) => {
      if (relevantFiles.length === 0) return fallback;
      // Shuffle and take count
      const selected = [...relevantFiles].sort(() => 0.5 - Math.random()).slice(0, count);
      return selected.length > 0 ? selected : fallback;
    };

    if (diffDays <= 7) {
      // Sprint Plan
      // Each phase takes full daily review time
      const t1 = dailyReviewTime;
      const t2 = dailyReviewTime;
      const t3 = dailyReviewTime;
      tasks = [
        { phase: '核心突破', description: `针对${subject}核心考点进行高强度突破，重点攻克高频考点。`, materials: getMaterials(2, ['核心考点手册', '历年真题']), estimatedTime: `${t1}分钟` },
        { phase: '真题演练', description: `每日一套${subject}真题，严格模拟考试环境与时间限制。`, materials: getMaterials(1, ['真题集']), estimatedTime: `${t2}分钟` },
        { phase: '错题复盘', description: '深度分析错题原因，针对性查漏补缺，总结解题套路。', materials: ['错题本'], estimatedTime: `${t3}分钟` },
      ];
    } else if (diffDays <= 30) {
      // Steady Plan
      // Each phase takes full daily review time
      const t1 = dailyReviewTime;
      const t2 = dailyReviewTime;
      const t3 = dailyReviewTime;
      tasks = [
        { phase: '基础巩固', description: `系统复习${subject}基础知识点，确保无盲区。`, materials: getMaterials(2, ['教材', '大纲']), estimatedTime: `${t1}分钟` },
        { phase: '专项练习', description: '针对薄弱环节进行专项训练，提升解题速度与准确率。', materials: getMaterials(1, ['专项练习册']), estimatedTime: `${t2}分钟` },
        { phase: '阶段测试', description: '每周进行一次阶段性自测，评估复习进度。', materials: getMaterials(1, ['模拟卷']), estimatedTime: `${t3}分钟` },
      ];
    } else {
      // Long-term Plan
      // Each phase takes full daily review time
      const t1 = dailyReviewTime;
      const t2 = dailyReviewTime;
      const t3 = dailyReviewTime;
      tasks = [
        { phase: '全面覆盖', description: `全面梳理${subject}知识体系，构建思维导图。`, materials: getMaterials(2, ['全书', '视频课程']), estimatedTime: `${t1}分钟` },
        { phase: '技巧提升', description: '学习各类题型的解题技巧 and 应对策略。', materials: getMaterials(1, ['技巧指南']), estimatedTime: `${t2}分钟` },
        { phase: '持续模考', description: '定期进行全真模拟，保持考试状态与手感。', materials: getMaterials(1, ['模拟题库']), estimatedTime: `${t3}分钟` },
      ];
    }

    // Adjust based on user level
    if (userLevel === '新手') {
      tasks.forEach(t => t.description = '【基础夯实】' + t.description);
    } else if (userLevel === '强化') {
      tasks.forEach(t => t.description = '【高分冲刺】' + t.description);
    }

    setReviewPlan({
      days: diffDays,
      tasks: tasks
    });
  };

  const renderGlobalUI = () => (
    <>
      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImportModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-qq-border flex items-center justify-between">
                <h3 className="text-lg font-bold text-qq-text">导入学习资料</h3>
                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8">
                {importStep === 'choice' && (
                  <div className="grid grid-cols-2 gap-6">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-qq-border hover:border-qq-blue hover:bg-blue-50 transition-all group"
                    >
                      <div className="p-4 bg-blue-50 text-qq-blue rounded-full mb-4 group-hover:bg-qq-blue group-hover:text-white transition-colors">
                        <Upload size={32} />
                      </div>
                      <span className="font-bold text-qq-text">本地上传</span>
                      <span className="text-[10px] text-qq-secondary mt-1">支持 PDF, DOCX, XLSX</span>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLocalUpload}
                        className="hidden" 
                      />
                    </button>
                    <button 
                      onClick={() => setImportStep('group_list')}
                      className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-qq-border hover:border-qq-blue hover:bg-blue-50 transition-all group"
                    >
                      <div className="p-4 bg-orange-50 text-orange-500 rounded-full mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Layers size={32} />
                      </div>
                      <span className="font-bold text-qq-text">从群聊导入</span>
                      <span className="text-[10px] text-qq-secondary mt-1">跨群整合学习资料</span>
                    </button>
                  </div>
                )}

                {importStep === 'group_list' && (
                  <div className="space-y-4">
                    <div className="text-xs text-qq-secondary font-bold uppercase tracking-wider mb-2">选择群聊</div>
                    <div 
                      onClick={() => setImportStep('group_files')}
                      className="flex items-center p-4 rounded-xl border border-qq-border hover:bg-qq-bg cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold mr-4">
                        309
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-qq-text">309宿舍小分队</div>
                        <div className="text-[10px] text-qq-secondary">4 份可导入文件</div>
                      </div>
                      <ChevronRight size={18} className="text-qq-border" />
                    </div>
                    {/* Other mock groups */}
                    <div className="flex items-center p-4 rounded-xl border border-qq-border opacity-50 cursor-not-allowed">
                      <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold mr-4">
                        计
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-qq-text">计算机学院通知群</div>
                        <div className="text-[10px] text-qq-secondary">暂无新文件</div>
                      </div>
                    </div>
                  </div>
                )}

                {importStep === 'group_files' && (
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <button onClick={() => setImportStep('group_list')} className="text-qq-blue text-xs font-bold flex items-center">
                        <ChevronRight size={14} className="rotate-180 mr-1" /> 返回群列表
                      </button>
                    </div>
                    <div className="text-xs text-qq-secondary font-bold uppercase tracking-wider mb-2">309宿舍小分队 - 群文件</div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {mockGroupFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center p-3 rounded-xl border border-qq-border hover:border-qq-blue group transition-all">
                          <FileText size={18} className="text-qq-secondary group-hover:text-qq-blue mr-3" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-qq-text">{file.name}</div>
                            <div className="text-[10px] text-qq-secondary">{file.date}</div>
                          </div>
                          <button 
                            onClick={() => handleImportFromGroup(file.name)}
                            className="p-2 text-qq-blue hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File Preview Modal */}
      <AnimatePresence>
        {showPreview && previewData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-qq-border flex items-center justify-between bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-qq-blue text-white rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{previewData.fileName}</h3>
                    <div className="flex items-center space-x-3 text-xs text-qq-secondary">
                      <span>第 {previewData.page} 页</span>
                      <span>•</span>
                      <span>发送人: {previewData.sender}</span>
                      <span>•</span>
                      <span className={previewData.priority === '高优先级' ? 'text-red-500 font-bold' : ''}>{previewData.priority}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-gray-100">
                {previewData.type === 'pdf' ? (
                  <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-sm p-16 min-h-full font-serif text-lg leading-relaxed text-gray-800">
                    <div className="whitespace-pre-wrap">
                      {highlightText(previewData.fullContent, evidenceSearchQuery)}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-qq-border p-8 min-h-[600px] flex items-center justify-center">
                      <Mermaid chart={`graph LR
    %% 全局样式定义
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef root fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,font-weight:bold,font-size:18px;
    classDef branch fill:#e8f5e9,stroke:#4caf50,stroke-width:1px;
    classDef leaf fill:#ffffff,stroke:#a5d6a7,stroke-dasharray: 5 5;

    %% 节点连接
    Center((ENVIRONMENT)):::root
    
    Center --- Pollution[POLLUTION]:::branch
    Center --- Action[ACTION]:::branch
    Center --- Climate[CLIMATE]:::branch
    
    Pollution --- B1(Acid rain):::leaf
    Pollution --- B2(Carbon dioxide):::leaf
    Pollution --- B3(Sewage):::leaf
    
    Action --- C1(Sort trash):::leaf
    Action --- C2(Renewable energy):::leaf
    
    Climate --- D1(Global warming):::leaf
    Climate --- D2(Greenhouse effect):::leaf
    Climate --- D3(Melting glaciers):::leaf

    %% 布局方向优化
    style Center color:#1b5e20,fill:#fff176,stroke:#fbc02d,stroke-width:4px`} />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-qq-border bg-white flex justify-center space-x-4">
                <button 
                  onClick={() => {
                    setShowPreview(false);
                    setEvidenceSearchQuery('');
                    setEvidenceResult(null);
                    setSearchResults([]); // Clear search results
                  }}
                  className="px-6 py-2 bg-qq-bg text-qq-text rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >返回</button>
                <button className="px-6 py-2 bg-qq-blue text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">下载 PDF</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Time Picker Modal */}
      <AnimatePresence>
        {showTimePicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[250]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 w-80 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-qq-blue">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">推送时间</h3>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Schedule Push</p>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mb-8 leading-relaxed">
                请设置管家每天为您推送微任务的时间，建议选择您最清醒的时段。
              </p>
              
              <div className="flex justify-center mb-10">
                <div className="relative group">
                  <input 
                    type="time" 
                    value={pushTime}
                    onChange={(e) => setPushTime(e.target.value)}
                    className="text-5xl font-black p-4 border-b-4 border-qq-blue focus:outline-none bg-blue-50/30 rounded-t-2xl text-qq-blue transition-all group-hover:bg-blue-50/50"
                  />
                  <div className="absolute -bottom-1 left-0 w-full h-1 bg-qq-blue/20 rounded-full" />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowTimePicker(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all active:scale-95"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    setShowTimePicker(false);
                    
                    // Add confirmation message
                    const confirmMsg: Message = {
                      id: Date.now().toString(),
                      sender: 'bot',
                      type: 'text',
                      time: '刚刚',
                      content: (
                        <div className="space-y-3">
                          <p className="font-bold text-qq-text">修改完毕！✅</p>
                          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-700 leading-relaxed">
                              从明天开始，我将在每天的 <span className="font-black text-qq-blue underline underline-offset-4">{pushTime}</span> 为您准时推送每日微任务。
                            </p>
                          </div>
                          <p className="text-[10px] text-qq-secondary italic">记得准时来打卡，不要让知识溜走哦！🚀</p>
                        </div>
                      )
                    };
                    setManagerMessages(prev => [...prev, confirmMsg]);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-qq-blue text-white text-sm font-bold hover:bg-blue-600 shadow-lg shadow-qq-blue/20 transition-all active:scale-95"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Wrong Questions Modal */}
      <AnimatePresence>
        {showWrongQuestionsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[250] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">错题集</h3>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">My Mistakes</p>
                  </div>
                </div>
                <button onClick={() => setShowWrongQuestionsModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {wrongQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-gray-900 font-bold mb-2">暂无错题</h3>
                    <p className="text-sm text-gray-500">太棒了！你还没有做错的题目，继续保持！</p>
                  </div>
                ) : (
                  wrongQuestions.map((q, idx) => (
                    <div key={idx} className="bg-red-50/30 border border-red-100 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded font-bold">
                          题目 {idx + 1}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          {q.type === 'choice' ? '单选' : q.type === 'boolean' ? '判断' : '填空'}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800">{q.question}</p>
                      
                      {q.type === 'choice' && (
                        <div className="space-y-2">
                          {q.options?.map((opt, i) => (
                            <div key={i} className={`text-sm p-3 rounded-xl border ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-white border-gray-100 text-gray-500'}`}>
                              {opt}
                              {opt === q.correctAnswer && <CheckCircle2 size={14} className="inline ml-2 text-emerald-500" />}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-white p-4 rounded-xl border border-gray-100 text-sm space-y-2">
                        <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          <BookOpen size={12} className="mr-1" /> 解析
                        </div>
                        <p className="text-gray-600 leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end">
                <button 
                  onClick={() => setShowWrongQuestionsModal(false)}
                  className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg shadow-gray-200"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-lg z-[300] flex items-center space-x-2"
          >
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (view === 'explanation') {
    return (
      <>
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-12 px-6">
            <div className="flex items-center justify-between mb-10">
              <button 
                onClick={() => setView('chat')}
                className="flex items-center text-qq-blue hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors font-bold text-sm"
              >
                <ChevronRight className="rotate-180 mr-2" size={20} />
                返回聊天
              </button>
              <h2 className="text-2xl font-black text-gray-900 flex items-center tracking-tight">
                <BookOpen className="mr-3 text-qq-blue" size={32} />
                今日任务深度解析
              </h2>
              <div className="w-24" />
            </div>

            <div className="space-y-10">
              {explanationData.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden transition-all hover:shadow-2xl hover:shadow-gray-300/50">
                  <div className="p-8 border-b border-gray-50 bg-gradient-to-br from-gray-50/50 to-white">
                    <div className="flex items-center mb-5">
                      <span className="bg-qq-blue text-white text-[10px] px-3 py-1 rounded-full font-black mr-3 uppercase tracking-widest shadow-lg shadow-qq-blue/20">
                        QUESTION {idx + 1}
                      </span>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        {q.type === 'choice' ? 'Multiple Choice' : q.type === 'boolean' ? 'True/False' : 'Fill in the Blank'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{q.question}</h3>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">Correct Answer</p>
                        <p className="text-lg font-bold text-emerald-900">{q.correctAnswer}</p>
                      </div>
                      <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest">Knowledge Point</p>
                        <p className="text-lg font-bold text-blue-900">
                          {q.type === 'choice' ? 'Reading Comprehension' : q.type === 'boolean' ? 'Logical Reasoning' : 'Vocabulary Mastery'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-gray-900 flex items-center uppercase tracking-widest">
                        <div className="w-1.5 h-5 bg-qq-blue rounded-full mr-3 shadow-sm" />
                        Detailed Explanation
                      </h4>
                      <div className="text-base text-gray-700 leading-relaxed bg-gray-50/50 p-6 rounded-2xl border border-gray-100 font-medium italic">
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center pb-12">
              <button 
                onClick={() => setView('chat')}
                className="px-16 py-4 bg-qq-blue text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-2xl shadow-qq-blue/30 hover:scale-[1.02] active:scale-[0.98] text-lg tracking-tight"
              >
                完成复习，返回聊天
              </button>
            </div>
          </div>
        </div>
      </div>
      {renderGlobalUI()}
    </>
    );
  }

  if (view === 'chat') {
    return (
      <>
        <div className="flex h-screen bg-white overflow-hidden font-sans text-qq-text">
        {/* Leftmost Sidebar (Icons) */}
        <div className="w-16 bg-[#F0F0F0] border-r border-qq-border flex flex-col items-center py-6 space-y-6">
          <div className="w-10 h-10 bg-qq-blue rounded-full flex items-center justify-center text-white mb-2">
            <Users size={20} />
          </div>
          <div className="text-qq-blue"><MessageSquare size={22} /></div>
          <div className="text-gray-500"><Users size={22} /></div>
          <div className="text-gray-500"><Hash size={22} /></div>
          <div className="text-gray-500"><Target size={22} /></div>
          <div className="mt-auto pb-4 text-gray-500"><MoreVertical size={22} /></div>
        </div>

        {/* Contact List Sidebar */}
        <div className="w-64 bg-[#F7F7F7] border-r border-qq-border flex flex-col">
          <div className="p-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="搜索" 
                className="w-full bg-[#EAEAEA] rounded-md px-3 py-1.5 text-xs focus:outline-none"
              />
              <Search size={14} className="absolute right-3 top-2 text-gray-400" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">最近聊天</div>
            <div 
              onClick={() => setActiveChat('english')}
              className={`${activeChat === 'english' ? 'bg-[#E5E5E5]' : 'hover:bg-[#EAEAEA]'} px-4 py-3 flex items-center space-x-3 cursor-pointer transition-colors`}
            >
              <div className="w-10 h-10 bg-qq-blue rounded-md flex items-center justify-center text-white font-bold">
                英
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium truncate">2025级本科生英语课通知群 (82)</span>
                  <span className="text-[10px] text-gray-400">15:30</span>
                </div>
                <div className="text-xs text-gray-400 truncate">助教: 已上传校对版大纲，请查收。</div>
              </div>
            </div>
            {/* Mock Course Groups */}
            <div 
              onClick={() => setActiveChat('dorm')}
              className={`${activeChat === 'dorm' ? 'bg-[#E5E5E5]' : 'hover:bg-[#EAEAEA]'} px-4 py-3 flex items-center space-x-3 cursor-pointer transition-colors`}
            >
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-md flex items-center justify-center font-bold">309</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium truncate">309宿舍小分队</span>
                  <span className="text-[10px] text-gray-400">12:45</span>
                </div>
                <div className="text-xs text-gray-400 truncate">张三: 谢了，正需要这个。</div>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center space-x-3 hover:bg-[#EAEAEA] cursor-pointer transition-colors">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center font-bold">数</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium truncate">高等数学A-2班</span>
                  <span className="text-[10px] text-gray-400">10:20</span>
                </div>
                <div className="text-xs text-gray-400 truncate">学习委员: [文件] 第五章课后习题答案.pdf</div>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center space-x-3 hover:bg-[#EAEAEA] cursor-pointer transition-colors">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-md flex items-center justify-center font-bold">计</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium truncate">计算机组成原理课程群</span>
                  <span className="text-[10px] text-gray-400">昨天</span>
                </div>
                <div className="text-xs text-gray-400 truncate">助教: 实验报告截止日期延期到周五。</div>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center space-x-3 hover:bg-[#EAEAEA] cursor-pointer transition-colors">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-md flex items-center justify-center font-bold">规</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium truncate">大学生职业生涯规划</span>
                  <span className="text-[10px] text-gray-400">星期一</span>
                </div>
                <div className="text-xs text-gray-400 truncate">班长: 收到请回复，谢谢。</div>
              </div>
            </div>

            <div 
              onClick={() => setActiveChat('manager_bot')}
              className={`${activeChat === 'manager_bot' ? 'bg-[#E5E5E5]' : 'hover:bg-[#EAEAEA]'} px-4 py-3 flex items-center space-x-3 cursor-pointer transition-colors`}
            >
              <div className="w-10 h-10 bg-purple-200 text-purple-700 rounded-md flex items-center justify-center font-bold">
                <Bot size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium truncate">QQ学习资料管家</span>
                  <span className="text-[10px] text-gray-400">在线</span>
                </div>
                <div className="text-xs text-gray-400 truncate">AI助手: 您好，有什么可以帮您？</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <header className="h-14 border-b border-qq-border flex items-center justify-between px-6">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base">
                {activeChat === 'english' ? '2025级本科生英语课通知群 (82)' : activeChat === 'dorm' ? '309宿舍小分队 (4)' : 'QQ学习资料管家'}
              </span>
            </div>
            <div className="flex items-center space-y-0 space-x-5 text-gray-500">
              {activeChat !== 'manager_bot' && (
                <>
                  <Phone size={18} className="cursor-pointer hover:text-qq-blue" />
                  <Video size={18} className="cursor-pointer hover:text-qq-blue" />
                  <div className="relative">
                    <LayoutGrid 
                      size={18} 
                      className={`cursor-pointer hover:text-qq-blue ${showAppMenu ? 'text-qq-blue' : ''}`} 
                      onClick={() => setShowAppMenu(!showAppMenu)}
                    />
                    
                    {/* App Dropdown Menu */}
                    <AnimatePresence>
                      {showAppMenu && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 mt-2 w-40 bg-white border border-qq-border rounded-lg shadow-xl z-50 py-1"
                        >
                          <div className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                            <Folder size={16} className="mr-3 text-gray-400" /> 群文件
                          </div>
                          <div className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                            <ImageIcon size={16} className="mr-3 text-gray-400" /> 群相册
                          </div>
                          <div className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                            <FileBox size={16} className="mr-3 text-gray-400" /> 群作业
                          </div>
                          <div className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                            <Plus size={16} className="mr-3 text-gray-400" /> 群精华
                          </div>
                          <div className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                            <Video size={16} className="mr-3 text-gray-400" /> 群视频
                          </div>
                          <div className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                            <BookOpen size={16} className="mr-3 text-gray-400" /> 群课堂
                          </div>
                          <div className="h-px bg-qq-border my-1"></div>
                          <div 
                            onClick={() => {
                              setView('manager');
                              setShowAppMenu(false);
                            }}
                            className="flex items-center px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-qq-blue font-medium"
                          >
                            <FolderLock size={16} className="mr-3" /> 群学习资料管家
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <Plus size={18} className="cursor-pointer hover:text-qq-blue" />
                  <MoreVertical size={18} className="cursor-pointer hover:text-qq-blue" />
                </>
              )}
            </div>
          </header>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F5F5F5]">
            {activeChat === 'english' ? (
              <>
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 bg-blue-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">王</div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-400">王老师 14:20</div>
                    <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm text-sm max-w-md">
                      同学们，这是今年四级词汇大纲的初稿，大家先看着。
                      <div className="mt-3 p-3 bg-qq-bg rounded-lg border border-qq-border flex items-center space-x-3">
                        <FileText size={24} className="text-qq-blue" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">2026四级词汇大纲_初稿.pdf</div>
                          <div className="text-[10px] text-qq-secondary">1.2 MB</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">李</div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-400">李助教 15:30</div>
                    <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm text-sm max-w-md">
                      王老师，校对版已经弄好了，我发到群里了。
                      <div className="mt-3 p-3 bg-qq-bg rounded-lg border border-qq-border flex items-center space-x-3">
                        <FileText size={24} className="text-qq-blue" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">2026四级词汇大纲_校对版.pdf</div>
                          <div className="text-[10px] text-qq-secondary">1.3 MB</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : activeChat === 'manager_bot' ? (
              <>
                {managerMessages.map(msg => (
                  <div key={msg.id} className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold ${msg.sender === 'bot' ? 'bg-purple-200 text-purple-700' : 'bg-blue-600 text-white'}`}>
                      {msg.sender === 'bot' ? <Bot size={20} /> : '我'}
                    </div>
                    <div className={`space-y-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                      <div className="text-[10px] text-gray-400">{msg.sender === 'bot' ? 'QQ学习资料管家 ' + (msg.time || '') : '我 ' + (msg.time || '')}</div>
                      <div className={`p-3 shadow-sm text-sm max-w-md ${msg.sender === 'bot' ? 'bg-white rounded-r-xl rounded-bl-xl' : 'bg-blue-600 text-white rounded-l-xl rounded-br-xl'}`}>
                        {msg.type === 'quiz' && msg.quizData ? (
                          <InteractiveQuizMessage 
                            questions={msg.quizData} 
                            onComplete={(results) => {
                              const correctCount = results.filter(r => r.isCorrect).length;
                              const accuracy = Math.round((correctCount / results.length) * 100);
                              
                              // Save wrong questions
                              const wrong = results.filter(r => !r.isCorrect).map(r => {
                                const q = msg.quizData!.find(q => q.id === r.qId);
                                return q;
                              }).filter(Boolean) as QuizItem[];
                              
                              if (wrong.length > 0) {
                                setWrongQuestions(prev => {
                                  const newWrongs = [...prev];
                                  wrong.forEach(w => {
                                    if (!newWrongs.find(existing => existing.id === w.id)) {
                                      newWrongs.push(w);
                                    }
                                  });
                                  return newWrongs;
                                });
                              }
                              
                              const summaryMessage: Message = {
                                id: (Date.now() + 1).toString(),
                                sender: 'bot',
                                type: 'text',
                                time: '刚刚',
                                content: (
                                  <div className="space-y-3">
                                    <p className="font-bold text-qq-text">任务完成报告 📊</p>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                                      <p className="text-xs">本次练习正确率：<span className={`font-bold ${accuracy >= 60 ? 'text-emerald-600' : 'text-red-600'}`}>{accuracy}%</span></p>
                                      <p className="text-xs text-qq-secondary leading-relaxed">
                                        {accuracy === 100 
                                          ? "太棒了！你已经完全掌握了这部分内容，继续保持！" 
                                          : `根据答题情况，建议您在后续复习中着重关注 ${accuracy < 50 ? '基础词汇与语法' : '长难句分析'} 部分。`}
                                      </p>
                                    </div>
                                    <p className="text-xs">是否现在查看详细的题目解析？</p>
                                    <div className="flex justify-end">
                                      <button 
                                        onClick={() => {
                                          setExplanationData(msg.quizData!);
                                          setView('explanation');
                                        }}
                                        className="px-4 py-1.5 bg-qq-blue text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm"
                                      >
                                        是，查看解析
                                      </button>
                                    </div>
                                  </div>
                                )
                              };
                              setManagerMessages(prev => [...prev, summaryMessage]);
                            }} 
                          />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 bg-pink-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">盈</div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-400">李盈盈 12:30</div>
                    <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm text-sm max-w-md">
                      大家四级准备得怎么样了？
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 bg-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">冰</div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-400">范冰冰 12:35</div>
                    <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm text-sm max-w-md">
                      还在背单词，感觉快来不及了。😭
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 bg-orange-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">王</div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-400">王五 12:40</div>
                    <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm text-sm max-w-md">
                      我这有一份必刷题，感觉挺有用的，发群里大家看看。
                      <div className="mt-3 p-3 bg-qq-bg rounded-lg border border-qq-border flex items-center space-x-3">
                        <FileText size={24} className="text-qq-blue" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">四级真题必刷题.pdf</div>
                          <div className="text-[10px] text-qq-secondary">2.5 MB</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start flex-row-reverse space-x-reverse space-x-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">我</div>
                  <div className="space-y-1 text-right">
                    <div className="text-[10px] text-gray-400">张三 12:45</div>
                    <div className="bg-blue-600 text-white p-3 rounded-l-xl rounded-br-xl shadow-sm text-sm max-w-md inline-block">
                      谢了，正需要这个。
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Chat Input */}
          {activeChat !== 'manager_bot' && (
            <div className="h-40 border-t border-qq-border flex flex-col">
              <div className="flex items-center px-4 py-2 space-x-4 text-gray-500">
                <Smile size={20} className="cursor-pointer hover:text-qq-blue" />
                <Scissors size={20} className="cursor-pointer hover:text-qq-blue" />
                <Folder size={20} className="cursor-pointer hover:text-qq-blue" />
                <ImageIcon size={20} className="cursor-pointer hover:text-qq-blue" />
                <Mail size={20} className="cursor-pointer hover:text-qq-blue" />
                <Mic size={20} className="cursor-pointer hover:text-qq-blue" />
                <Bot size={20} className="cursor-pointer hover:text-qq-blue" />
                <div className="flex-1"></div>
                <Clock size={20} className="cursor-pointer hover:text-qq-blue" />
              </div>
              <textarea 
                className="flex-1 px-4 py-2 text-sm focus:outline-none resize-none"
                placeholder="输入消息..."
              ></textarea>
              <div className="flex justify-end px-4 pb-3">
                <div className="flex">
                  <button className="bg-qq-blue text-white px-6 py-1.5 rounded-l-md text-sm hover:bg-blue-600">发送</button>
                  <button className="bg-qq-blue text-white px-2 py-1.5 rounded-r-md border-l border-white/20 hover:bg-blue-600">
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar (Group Info) */}
        {activeChat !== 'manager_bot' && (
          <div className="w-60 border-l border-qq-border bg-white flex flex-col">
            <div className="p-4 border-b border-qq-border">
              <div className="text-xs font-bold text-gray-400 mb-4">群公告</div>
              <div className="text-xs text-gray-500 leading-relaxed">
                请同学们及时下载四级词汇大纲，并开始复习。
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-xs font-bold text-gray-400 mb-4">
                群成员 ({activeChat === 'english' ? '82' : '4'})
              </div>
              <div className="space-y-4">
                {activeChat === 'english' ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">王</div>
                      <span className="text-xs">王老师</span>
                      <span className="bg-orange-100 text-orange-600 text-[8px] px-1 rounded">群主</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">李</div>
                      <span className="text-xs">李助教</span>
                      <span className="bg-blue-100 text-blue-600 text-[8px] px-1 rounded">管理员</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-[10px] font-bold">赵</div>
                      <span className="text-xs">赵大国</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">钱</div>
                      <span className="text-xs">钱二萌</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-[10px] font-bold">孙</div>
                      <span className="text-xs">孙小美</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">李</div>
                      <span className="text-xs">李华</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-[10px] font-bold">周</div>
                      <span className="text-xs">周杰伦</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">李</div>
                      <span className="text-xs">李盈盈</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-[10px] font-bold">范</div>
                      <span className="text-xs">范冰冰</span>
                    </div>
                  </>
                ) : activeChat === 'dorm' ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">我</div>
                      <span className="text-xs">张三 (我)</span>
                      <span className="bg-orange-100 text-orange-600 text-[8px] px-1 rounded">群主</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">盈</div>
                      <span className="text-xs">李盈盈</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold">冰</div>
                      <span className="text-xs">范冰冰</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">王</div>
                      <span className="text-xs">王五</span>
                    </div>
                  </>
                ) : null }
              </div>
            </div>
          </div>
        )}
      </div>
      {renderGlobalUI()}
    </>
    );
  }

  return (
    <div className="flex h-screen bg-qq-bg overflow-hidden">
      {/* QQ Style Sidebar */}
      <div className="w-20 bg-white border-r border-qq-border flex flex-col items-center py-8 space-y-8">
        <div 
          onClick={() => setView('chat')}
          className="w-12 h-12 bg-qq-blue rounded-full flex items-center justify-center text-white mb-4 cursor-pointer hover:bg-blue-600 transition-colors"
        >
          <MessageSquare size={24} />
        </div>
        
        <button 
          onClick={() => {
            setActiveTab('locker');
            setView('manager');
            // If activeChat is 'manager_bot', reset it to 'english' when entering 'manager' view
            if (activeChat === 'manager_bot') {
              setActiveChat('english');
            }
          }}
          className={`qq-sidebar-item ${activeTab === 'locker' && view === 'manager' ? 'active' : ''}`}
        >
          <FolderLock size={24} />
          <span className="text-[10px] mt-1">资料库</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('review_plan');
            setView('manager');
          }}
          className={`qq-sidebar-item ${activeTab === 'review_plan' && view === 'manager' ? 'active' : ''}`}
        >
          <Clock size={24} />
          <span className="text-[10px] mt-1">复习计划</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('tasks');
            setView('manager');
          }}
          className={`qq-sidebar-item ${activeTab === 'tasks' && view === 'manager' ? 'active' : ''}`}
        >
          <BrainCircuit size={24} />
          <span className="text-[10px] mt-1">AI小助手</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-qq-border flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setView('chat')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <h1 className="text-lg font-semibold text-qq-text">
              {activeTab === 'locker' ? 'QQ学习资料库' : activeTab === 'tasks' ? 'AI小助手' : 'AI 复习计划'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-qq-secondary">
              已存储 {files.length} 份文件
            </div>
            <button 
              onClick={() => {
                setShowImportModal(true);
                setImportStep('choice');
              }}
              className="bg-qq-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              导入资料
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'locker' && (
              <motion.div 
                key="locker"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-4"
              >
                {/* Evidence Search Bar */}
                <div className="bg-white p-6 rounded-3xl border border-qq-border shadow-sm space-y-4">
                  <div className="flex items-center space-x-3 text-qq-blue mb-2">
                    <Search size={20} />
                    <h3 className="font-bold">资料库检索</h3>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={evidenceSearchQuery}
                      onChange={(e) => setEvidenceSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEvidenceSearch()}
                      placeholder="输入你想检索的内容，例如：'如何写好四级作文开头？'" 
                      className="w-full bg-gray-50 border border-qq-border rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-qq-blue/20 focus:outline-none pr-12"
                    />
                    <button 
                      onClick={handleEvidenceSearch}
                      disabled={isEvidenceSearching}
                      className="absolute right-2 top-2 p-2 bg-qq-blue text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isEvidenceSearching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={16} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {evidenceResult && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-bold text-qq-blue flex items-center">
                              <FileText size={16} className="mr-2" /> {evidenceResult.fileName}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              evidenceResult.priority === '高优先级' ? 'bg-red-100 text-red-600' : 
                              evidenceResult.priority === '中优先级' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {evidenceResult.priority}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] text-qq-secondary">发送人: {evidenceResult.sender}</span>
                            <span className="text-[10px] bg-blue-100 text-qq-blue px-2 py-0.5 rounded">第 {evidenceResult.page} 页</span>
                          </div>
                        </div>
                        <div className="bg-white/60 p-4 rounded-xl border border-blue-100/50">
                          <p className="text-xs text-qq-text leading-relaxed italic">
                            {highlightText(evidenceResult.snippet, evidenceSearchQuery)}
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => {
                              setPreviewData(evidenceResult);
                              setShowPreview(true);
                            }}
                            className="text-xs text-qq-blue font-bold flex items-center hover:underline"
                          >
                            在网页中预览并查看高亮 <ChevronRight size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-qq-border">
                   <span className="text-xs font-bold text-gray-400">文件</span>
                   <div className="flex items-center text-xs text-gray-500 cursor-pointer hover:text-qq-blue">
                      优先学习 <ChevronDown size={14} className="ml-1" />
                   </div>
                </div>

                {/* Vertical List */}
                <div className="space-y-px bg-qq-border rounded-xl overflow-hidden border border-qq-border">
                  {isLoadingFiles ? (
                    <div className="bg-white py-20 flex flex-col items-center justify-center space-y-4">
                      <div className="w-10 h-10 border-4 border-qq-blue border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-qq-secondary">正在加载资料库资料...</p>
                    </div>
                  ) : files.length > 0 ? (
                    files.map(file => (
                      <div key={file.id} className="bg-white hover:bg-gray-50 px-6 py-4 flex items-center group transition-colors">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-qq-blue mr-4 flex-shrink-0">
                          <FileText size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                             <h3 className="text-sm font-medium text-qq-text truncate" title={file.name}>{file.name}</h3>
                             {file.is_final === 1 ? (
                               <span className="bg-emerald-100 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">最终版</span>
                             ) : (
                               <>
                                 {file.name.includes('初稿') && (
                                   <span className="bg-amber-100 text-amber-600 text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap flex items-center">
                                      <AlertCircle size={10} className="mr-1" /> 检测到冗余旧版本，建议清理
                                   </span>
                                 )}
                                 {file.name.includes('校对版') && (
                                   <button 
                                     onClick={() => handleSetFinal(file)}
                                     className="bg-blue-50 text-qq-blue text-[10px] px-1.5 py-0.5 rounded font-bold hover:bg-blue-100 transition-colors whitespace-nowrap"
                                   >
                                     建议设为最终版
                                   </button>
                                 )}
                               </>
                             )}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1 flex items-center space-x-3">
                             <span>{file.page_count > 0 ? `${file.page_count * 12} KB` : '15.4 MB'}</span>
                             <span className="flex items-center">
                               <Users size={10} className="mr-1" /> {file.sender}
                             </span>
                             <span className={`font-medium ${
                               file.priority === '高优先级' ? 'text-red-500' : 
                               file.priority === '中优先级' ? 'text-orange-500' : 'text-gray-500'
                             }`}>
                               {file.priority}
                             </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center ml-4">
                           <div className="text-right mr-4">
                              <div className="text-[10px] text-gray-400">{file.upload_date.slice(5)}</div>
                              <div className="text-[10px] text-gray-400 mt-1">来自: {file.group_name.length > 8 ? file.group_name.slice(0, 8) + '...' : file.group_name}</div>
                           </div>
                           
                           {/* Actions on hover */}
                           <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleGenerateQuiz(file)} 
                                className="p-2 hover:bg-blue-100 rounded-lg text-qq-blue transition-colors" 
                                title="生成AI题目"
                              >
                                 <BrainCircuit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(file.id)} 
                                className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors" 
                                title="删除"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white py-20 text-center">
                      <div className="w-16 h-16 bg-qq-bg rounded-full flex items-center justify-center mx-auto mb-4 text-qq-secondary">
                        <FileText size={32} />
                      </div>
                      <p className="text-qq-secondary">资料库暂无文件，请从群聊导入或本地上传</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'review_plan' && (
              <motion.div
                key="review_plan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                <div className="qq-card p-8 space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-3">科目</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="例如：英语四级"
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-qq-blue focus:ring-4 focus:ring-qq-blue/10 outline-none transition-all font-medium text-qq-text"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-3">目标日期</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-qq-blue focus:ring-4 focus:ring-qq-blue/10 outline-none transition-all font-medium text-qq-text"
                        />
                        {targetDate && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none bg-white px-2">
                            {(() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const target = new Date(targetDate);
                              target.setHours(0, 0, 0, 0);
                              const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              if (diff === 0) return '今天';
                              if (diff < 0) return `${Math.abs(diff)} 天前`;
                              return `${diff} 天后`;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-3">难度档位</label>
                      <div className="flex p-1 bg-gray-100 rounded-2xl">
                        {(['新手', '中等', '强化'] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => setUserLevel(level)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                              userLevel === level 
                                ? 'bg-qq-blue text-white shadow-lg shadow-qq-blue/20' 
                                : 'text-gray-500 hover:text-qq-text'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-500">每日复习时间</label>
                        <span className="text-sm font-bold text-qq-blue">{dailyReviewTime} 分钟</span>
                      </div>
                      <div className="relative h-10 flex items-center">
                        <input
                          type="range"
                          min="5"
                          max="180"
                          step="5"
                          value={dailyReviewTime}
                          onChange={(e) => setDailyReviewTime(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-qq-blue"
                          style={{
                            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(dailyReviewTime - 5) / (180 - 5) * 100}%, #E5E7EB ${(dailyReviewTime - 5) / (180 - 5) * 100}%, #E5E7EB 100%)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>5 分钟</span>
                        <span>180 分钟</span>
                      </div>
                    </div>

                    <button
                      onClick={generateReviewPlan}
                      className="w-full py-4 bg-qq-blue text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl shadow-qq-blue/20 active:scale-[0.98] disabled:opacity-50"
                      disabled={!targetDate}
                    >
                      生成复习计划
                    </button>
                  </div>
                </div>

                {reviewPlan && (
                  <div className="qq-card p-6 space-y-4">
                    <h3 className="text-lg font-bold">您的 {subject} 复习计划 ({reviewPlan.days} 天)</h3>
                    <div className="space-y-3">
                      {reviewPlan.tasks.map((task, index) => (
                        <div key={index} className="border border-qq-border p-4 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="bg-qq-bg text-qq-blue text-xs px-2 py-1 rounded font-bold">第 {index * 2 + 1}-{index * 2 + 2} 天</span>
                            <span className="text-xs text-qq-secondary">预计耗时: {task.estimatedTime}</span>
                          </div>
                          <p className="font-medium text-qq-text">{task.description}</p>
                          <div className="text-xs text-qq-secondary flex flex-wrap gap-2">
                            资料: {task.materials.map((material, mIdx) => (
                              <span key={mIdx} className="bg-gray-100 px-2 py-0.5 rounded">{material}</span>
                            ))}
                          </div>
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              onClick={() => {
                                setToastMessage('加入成功，将于稍后推送');
                                setShowToast(true);
                                
                                setTimeout(() => {
                                  setShowToast(false);
                                  setView('chat');
                                  setActiveChat('manager_bot');
                                  
                                  const mockQuestions: QuizItem[] = [
                                    {
                                      id: 1,
                                      type: 'choice',
                                      question: 'According to the passage, what is the main reason for the decline in bee populations?',
                                      options: ['A. Climate change', 'B. Pesticide use', 'C. Habitat loss', 'D. All of the above'],
                                      correctAnswer: 'D. All of the above',
                                      explanation: '根据文档第12页“生态危机”章节 ，文中明确提到全球变暖（Climate change）、农药过度使用（Pesticide use）以及城市化导致的栖息地减少（Habitat loss）共同导致了蜜蜂数量的锐减。'
                                    },
                                    {
                                      id: 2,
                                      type: 'boolean',
                                      question: 'The author suggests that individual actions can have a significant impact on environmental protection.',
                                      correctAnswer: 'True',
                                      explanation: '在文档《四级作文万能模板汇总》的末尾段落中 ，作者呼吁“It is high time that we took some effective measures...”，强调了个体采取有效措施对解决环境问题的关键性。'
                                    },
                                    {
                                      id: 3,
                                      type: 'fill',
                                      question: 'The term "sustainable development" was first popularized in the ______ Report.',
                                      correctAnswer: 'Brundtland',
                                      explanation: '该考点源自你个人空间内标记为“最终版”的《环境背景知识大全》第8页 。布伦特兰报告（Brundtland Report）正式定义并推广了“可持续发展”这一术语。'
                                    }
                                  ];

                                  const newMessages: Message[] = [
                                    {
                                      id: Date.now().toString(),
                                      sender: 'bot',
                                      type: 'quiz',
                                      quizData: mockQuestions,
                                      time: '刚刚'
                                    }
                                  ];
                                  setManagerMessages(prev => [...prev, ...newMessages]);
                                }, 1500);
                              }}
                              className="text-xs text-qq-blue hover:underline"
                            >加入微任务</button>
                            <button className="text-xs text-qq-secondary hover:underline">调整</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl shadow-sm border border-qq-border overflow-hidden"
              >
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                  {assistantMessages.map((msg) => (
                    <div key={msg.id} className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold ${msg.sender === 'bot' ? 'bg-purple-200 text-purple-700' : 'bg-blue-600 text-white'}`}>
                        {msg.sender === 'bot' ? <Bot size={20} /> : '我'}
                      </div>
                      <div className={`space-y-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                        <div className="text-[10px] text-gray-400">{msg.sender === 'bot' ? 'AI小助手 ' + (msg.time || '') : '我 ' + (msg.time || '')}</div>
                        <div className={`p-3 shadow-sm text-sm max-w-md text-left ${msg.sender === 'bot' ? 'bg-white rounded-r-xl rounded-bl-xl' : 'bg-blue-600 text-white rounded-l-xl rounded-br-xl'}`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={assistantEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-qq-border">
                  <div className="relative">
                    <textarea
                      value={assistantInput}
                      onChange={(e) => setAssistantInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAssistantSend();
                        }
                      }}
                      placeholder="输入你的问题..."
                      className="w-full p-4 pr-12 bg-gray-50 border border-qq-border rounded-2xl focus:bg-white focus:border-qq-blue focus:ring-4 focus:ring-qq-blue/10 outline-none transition-all resize-none h-24 text-sm"
                    />
                    <button 
                      onClick={handleAssistantSend}
                      disabled={!assistantInput.trim()}
                      className="absolute right-3 bottom-3 p-2 bg-qq-blue text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center space-x-2 text-xs text-qq-secondary">
                    <span className="bg-blue-50 text-qq-blue px-2 py-1 rounded cursor-pointer hover:bg-blue-100" onClick={() => setAssistantInput('请总结四级作文高分要点')}>
                      请总结四级作文高分要点
                    </span>
                    <span className="bg-blue-50 text-qq-blue px-2 py-1 rounded cursor-pointer hover:bg-blue-100" onClick={() => setAssistantInput('如何高效背单词？')}>
                      如何高效背单词？
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {renderGlobalUI()}
    </div>
  );
}
