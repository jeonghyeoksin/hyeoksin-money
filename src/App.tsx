/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { Sparkles, ArrowRight, Loader2, Target, Lightbulb, Rocket, TrendingUp, Coins, Settings, X, Key, Briefcase, Wallet, PenTool, Download, FileText, ExternalLink, HelpCircle, Mail, MessageSquare } from 'lucide-react';

export default function App() {
  const [currentStatus, setCurrentStatus] = useState('');
  const [interest, setInterest] = useState('');
  const [skills, setSkills] = useState('');
  const [workStyle, setWorkStyle] = useState('');
  const [time, setTime] = useState('');
  const [capital, setCapital] = useState('');
  const [targetIncome, setTargetIncome] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const isGenerating = useRef(false);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const handleSaveKey = () => {
    localStorage.setItem('gemini_api_key', tempKey);
    setApiKey(tempKey);
    setShowKeyModal(false);
  };

  useEffect(() => {
    if (result && !loading && isGenerating.current) {
      handleDownloadDocx();
      isGenerating.current = false;
    }
  }, [result, loading]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStatus || !interest || !skills || !workStyle || !time || !capital || !targetIncome) {
      setError('모든 항목을 입력해주세요. 정확한 로드맵 설계를 위해 필요합니다.');
      return;
    }

    const currentKey = apiKey || process.env.GEMINI_API_KEY;
    if (!currentKey) {
      setError('Google Gemini API Key를 설정해주세요.');
      setTempKey(apiKey);
      setShowKeyModal(true);
      return;
    }

    setError('');
    setLoading(true);
    setResult('');
    isGenerating.current = true;

    try {
      const ai = new GoogleGenAI({ apiKey: currentKey });
      const prompt = `
당신은 '정혁신'이 만든 '혁신 수익화 발굴 AI'입니다.
AI 왕초보자도 AI를 활용하여 나만의 수익화를 발굴하고 실행할 수 있도록 돕는 정혁신입니다.

사용자 정보:
- 현재 직업/상황: ${currentStatus}
- 관심사/좋아하는 분야: ${interest}
- 현재 보유 기술/경험: ${skills}
- 선호하는 작업 방식: ${workStyle}
- 하루 투자 가능 시간: ${time}
- 초기 투자 가능 자본금: ${capital}
- 목표 월 수익: ${targetIncome}

위 정보를 바탕으로 다음 내용을 포함하여 마크다운 형식으로 상세히 작성해주세요.

[출력 형식 및 스타일 가이드]
- 최대한 자세하고 가독성 좋게 작성해주세요.
- 중요한 키워드나 핵심 내용은 반드시 **굵게(Bold)** 표시하세요.
- 강조할 텍스트는 <span style="color: #1d4ed8; font-weight: bold;">진한 파란색</span>으로 작성하세요.
- 매우 중요한 텍스트는 <span style="color: #dc2626; font-weight: bold;">빨간색</span>으로 작성하세요.
- 꼭 참조해야 할 사항은 <span style="background-color: #fef08a; font-weight: bold; color: #1f2937;">노란색 배경</span>으로 작성하세요.
- 마크다운 문법과 HTML 태그(span)를 적절히 혼용하여 시각적으로 훌륭한 문서를 만들어주세요.
- [금지 사항] "AI가 써준 글을 100% 그대로 복사-붙여넣기 하면 저품질 블로그로 낙인찍힌다"와 같은 부정적인 경고 문구는 절대 작성하지 마세요.
- [권장 사항] 대신, "혁신 AI를 적극적으로 활용하여 당신만의 독창적인 콘텐츠와 가치를 창출해보세요!"와 같이 혁신 AI의 활용을 적극 권장하고 응원하는 긍정적인 메시지를 포함하세요.

1. 수익화 아이디어 브레인스토밍 (최소 3가지): 사용자의 상황에 최적화된, AI를 활용한 구체적인 수익화 아이디어
2. 선택된 최적의 아이디어 1가지와 그 이유: 가장 현실적이고 효과적인 아이디어 선정
3. AI 왕초보자를 위한 맞춤형 가이드라인: 가이드라인만 따라 하면 누구든지 AI로 수익화를 할 수 있도록 매우 자세하고 디테일하며 쉽게 작성해주세요. 텍스트 생성 AI 툴로는 ChatGPT 대신 반드시 'Google Gemini'를 추천하고 활용법을 설명해야 합니다. Google Gemini에 어떻게 접속하고, 어떤 프롬프트를 입력해야 하는지 마우스 클릭 단위로 초등학생도 이해할 수 있게 설명해야 합니다.
4. 단계별 실행 로드맵 (1주차 ~ 4주차 이상): 당장 오늘부터 시작할 수 있는 구체적인 Action Plan을 일차별/주차별로 아주 세밀하게 쪼개서 제공해주세요.

어조는 전문가답고, 동기를 부여하며, 극도로 구체적이고 실천 가능해야 합니다.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      setResult(response.text || '결과를 생성하지 못했습니다.');
    } catch (err) {
      console.error(err);
      setError('AI 결과를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    // Find the start of the actual content (usually starts with "1.")
    const lines = result.split('\n');
    let startIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Matches "1.", "# 1.", "## 1.", "### 1." etc.
      if (/^(#+\s*)?1\./.test(line)) {
        startIndex = i;
        break;
      }
    }

    const contentToDownload = startIndex !== -1 ? lines.slice(startIndex).join('\n') : result;
    const fileName = `혁신 수익화 발굴 AI_${currentStatus || '분석'}_${interest || '결과'}`;

    const blob = new Blob([contentToDownload], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    if (!result) return;

    // Find content starting from "1."
    const lines = result.split('\n');
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^(#+\s*)?1\./.test(lines[i].trim())) {
        startIndex = i;
        break;
      }
    }
    const cleanLines = startIndex !== -1 ? lines.slice(startIndex) : lines;

    const docChildren: Paragraph[] = [];

    // Title for the document
    docChildren.push(
      new Paragraph({
        text: "혁신 수익화 발굴 AI - 로드맵",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    for (const line of cleanLines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        docChildren.push(new Paragraph({ spacing: { before: 200 } }));
        continue;
      }

      // Handle headers
      if (trimmedLine.startsWith('#')) {
        const levelMatch = trimmedLine.match(/^#+/);
        const level = levelMatch ? levelMatch[0].length : 1;
        const text = trimmedLine.replace(/^#+\s*/, '');
        docChildren.push(
          new Paragraph({
            text: text,
            heading: level === 1 ? HeadingLevel.HEADING_2 : level === 2 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
            spacing: { before: 240, after: 120 },
          })
        );
        continue;
      }

      // Complex line parsing for colors/bold
      const runs: TextRun[] = [];
      let currentText = trimmedLine;

      // Handle simple list markers
      if (/^[\d-]\./.test(currentText) || currentText.startsWith('* ') || currentText.startsWith('- ')) {
        // Just keep the text for now, docx doesn't handle nested markdown easily without a proper library
      }

      // Regex for bold **text** and span styles
      // This is a simplified parser for the specific prompt requirements
      const segments = currentText.split(/(<span.*?>.*?<\/span>|\*\*.*?\*\*)/g);

      for (const segment of segments) {
        if (!segment) continue;

        if (segment.startsWith('<span')) {
          const colorMatch = segment.match(/color:\s*(#[a-fA-F0-9]{3,6})/);
          const bgColorMatch = segment.match(/background-color:\s*(#[a-fA-F0-9]{3,6})/);
          const text = segment.replace(/<span.*?>|<\/span>/g, '');
          
          runs.push(
            new TextRun({
              text: text,
              bold: segment.includes('font-weight: bold'),
              color: colorMatch ? colorMatch[1].replace('#', '') : undefined,
              shading: bgColorMatch ? { fill: bgColorMatch[1].replace('#', '') } : undefined,
            })
          );
        } else if (segment.startsWith('**') && segment.endsWith('**')) {
          runs.push(
            new TextRun({
              text: segment.slice(2, -2),
              bold: true,
            })
          );
        } else {
          runs.push(new TextRun(segment));
        }
      }

      docChildren.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren,
      }],
    });

    const fileName = `혁신 수익화 발굴 AI_${currentStatus || '분석'}_${interest || '결과'}`;
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              혁신 수익화 발굴 <span className="text-red-600">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${apiKey ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}></div>
                {apiKey ? 'API Key 적용됨' : 'API Key 미적용'}
              </div>
              <button 
                onClick={() => { setTempKey(apiKey); setShowKeyModal(true); }}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                설정
              </button>
            </div>
            <div className="text-sm font-medium text-zinc-400 border-l border-zinc-800 pl-4">
              Developed by <span className="text-yellow-500">정혁신</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Image Section */}
      <section className="max-w-6xl mx-auto px-6 pt-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full aspect-video rounded-3xl overflow-hidden relative shadow-2xl border border-zinc-800 group"
        >
          <img 
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop" 
            alt="AI Monetization and Wealth" 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 group-hover:scale-105 transform"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-900/40 to-transparent"></div>
          
          {/* Floating Badges */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 3 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
            className="absolute top-8 right-8 md:top-12 md:right-12 bg-zinc-900/80 backdrop-blur-xl border border-yellow-500/30 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:rotate-0 transition-transform hidden sm:block"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-xs font-medium mb-1">데이터 기반 분석</p>
                <p className="text-white font-bold text-xl tracking-tight">초개인화 로드맵<span className="text-yellow-500">✨</span></p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            transition={{ delay: 0.6, duration: 0.5, type: "spring" }}
            className="absolute bottom-12 right-12 md:bottom-20 md:right-24 bg-zinc-900/80 backdrop-blur-xl border border-red-500/30 px-5 py-3 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:rotate-0 transition-transform hidden md:block"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-full">
                <Lightbulb className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg tracking-tight">숨겨진 가치 발견</p>
              </div>
            </div>
          </motion.div>

          <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>정혁신 AI 솔루션</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              AI로 시작하는 <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">나만의 맞춤 수익화 발굴</span>
            </h2>
            <p className="text-zinc-300 text-base md:text-lg max-w-xl font-medium leading-relaxed">
              당신의 숨겨진 잠재력을 찾아내어, 당장 오늘부터 시작할 수 있는 가장 현실적인 수익화 로드맵을 설계합니다.
            </p>
          </div>
        </motion.div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-[1fr_1.5fr] gap-12 items-start">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 sticky top-24"
        >
          <div>
            <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
              나만의 <span className="text-yellow-500">수익화 파이프라인</span>을<br />
              발견하세요
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              AI 왕초보자도 쉽게 따라할 수 있는 맞춤형 수익화 로드맵을 제공합니다. 당신의 관심사와 기술을 입력하고 새로운 가능성을 확인해보세요.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5 bg-zinc-900/80 p-6 sm:p-8 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Briefcase className="w-4 h-4 text-yellow-500" />
                  현재 직업/상황
                </label>
                <input
                  type="text"
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  placeholder="예: 직장인, 취준생, 주부 등"
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Target className="w-4 h-4 text-red-500" />
                  관심사 및 분야
                </label>
                <input
                  type="text"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  placeholder="예: 글쓰기, 디자인, 마케팅 등"
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  현재 보유 기술 및 경험
                </label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="예: 엑셀 활용 가능, 블로그 운영 경험 있음, 특별한 기술 없음 등"
                  rows={2}
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <PenTool className="w-4 h-4 text-red-500" />
                  선호하는 작업 방식
                </label>
                <input
                  type="text"
                  value={workStyle}
                  onChange={(e) => setWorkStyle(e.target.value)}
                  placeholder="예: 혼자 글쓰기, 사람들과 소통"
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Rocket className="w-4 h-4 text-yellow-500" />
                  하루 투자 가능 시간
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="예: 퇴근 후 2시간, 주말 4시간"
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Wallet className="w-4 h-4 text-red-500" />
                  초기 투자 가능 자본금
                </label>
                <input
                  type="text"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  placeholder="예: 0원 (무자본), 10만원 이하"
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  목표 월 수익
                </label>
                <input
                  type="text"
                  value={targetIncome}
                  onChange={(e) => setTargetIncome(e.target.value)}
                  placeholder="예: 부수입 월 50만원, 전업 월 500만원"
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI가 분석 중입니다...
                </>
              ) : (
                <>
                  수익화 로드맵 생성하기
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Output Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative min-h-[600px] flex flex-col backdrop-blur-sm"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 flex-1 flex flex-col">
            {result && !loading && (
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-500/20 p-2 rounded-full">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white">수익화 분석 결과</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all border border-zinc-700 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    MD 다운로드
                  </button>
                  <button
                    onClick={handleDownloadDocx}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-lg text-sm font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Word 다운로드
                  </button>
                </div>
              </div>
            )}
            {!result && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                <div className="relative w-full max-w-lg aspect-[16/10] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-zinc-700/50 group">
                  <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop" 
                    alt="Monetization Dashboard" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 group-hover:scale-105 transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                    <div className="bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-zinc-700/50 flex items-center gap-3 shadow-xl">
                      <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                      <span className="text-zinc-200 font-medium tracking-wide">AI 수익화 로드맵 대기 중</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-200">당신만의 파이프라인을 설계하세요</h3>
                  <p className="text-zinc-400 leading-relaxed max-w-md mx-auto">
                    좌측에 정보를 입력하고 생성 버튼을 누르면<br />
                    AI가 맞춤형 수익화 로드맵을 설계합니다.
                  </p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-zinc-800 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-yellow-500 font-medium animate-pulse text-center">
                  정혁신의 AI가 최적의 수익화 모델을<br />브레인스토밍 중입니다...
                </p>
              </div>
            ) : (
              <div className="prose prose-invert prose-yellow max-w-none overflow-y-auto pr-4 custom-scrollbar flex-1">
                <div className="markdown-body">
                  <Markdown rehypePlugins={[rehypeRaw]}>{result}</Markdown>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* API Key Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-500/20 p-2 rounded-full">
                    <Key className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Google API Key 설정</h3>
                </div>
                <button onClick={() => setShowKeyModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Gemini API Key</label>
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="AI Studio API Key를 입력하세요"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    입력하신 키는 브라우저 로컬 스토리지에만 안전하게 저장됩니다.
                  </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveKey}
                    className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-colors shadow-lg"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Buttons - Bottom Right */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-40">
        <motion.a
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          href="https://hyeoksinai.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 hover:border-yellow-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl transition-all group"
        >
          <div className="bg-yellow-500/20 p-1.5 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
            <ExternalLink className="w-4 h-4 text-yellow-500" />
          </div>
          <span className="text-sm font-bold tracking-tight">혁신 AI 바로가기</span>
        </motion.a>

        <motion.button
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSupportModal(true)}
          className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 hover:border-red-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl transition-all group"
        >
          <div className="bg-red-500/20 p-1.5 rounded-lg group-hover:bg-red-500/30 transition-colors">
            <HelpCircle className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-sm font-bold tracking-tight">오류 및 유지보수</span>
        </motion.button>
      </div>

      {/* Support / Maintenance Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 p-3 rounded-2xl">
                    <MessageSquare className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">고객 지원</h3>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Support & Maintenance</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSupportModal(false)} 
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white p-2 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="w-5 h-5 text-yellow-500" />
                    <span className="text-zinc-300 font-bold text-lg">info@nextin.ai.kr</span>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                    위 이메일로 <span className="text-white font-bold">오류 및 유지보수 요청사항</span>을 발송해주시면, <span className="text-green-400 font-bold">실시간 확인 후 신속하게 피드백</span>을 드립니다.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-all shadow-lg"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

