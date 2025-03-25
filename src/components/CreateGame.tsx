'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { BALANCE_GAME_ABI } from '@/constants/abi';
import { BALANCE_GAME_ADDRESS } from '@/constants/addresses';

interface CreateGameProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateGame({ isOpen, onClose, onSuccess }: CreateGameProps) {
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { writeContract, isPending } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('지갑을 연결해주세요.');
      return;
    }

    try {
      await writeContract({
        address: BALANCE_GAME_ADDRESS,
        abi: BALANCE_GAME_ABI,
        functionName: 'createGame',
        args: [question, optionA, optionB],
      });
      setQuestion('');
      setOptionA('');
      setOptionB('');
      alert('게임 생성 트랜잭션이 전송되었습니다!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('게임 생성 중 오류가 발생했습니다:', error);
      alert('게임 생성 중 오류가 발생했습니다.');
    }
  };

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-lg w-full max-w-xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">새로운 밸런스 게임 만들기</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-gray-600 font-medium mb-2">
              질문
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="밸런스 게임 질문을 입력하세요"
              required
            />
          </div>
          <div>
            <label htmlFor="optionA" className="block text-gray-600 font-medium mb-2">
              선택지 A
            </label>
            <input
              type="text"
              id="optionA"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="첫 번째 선택지를 입력하세요"
              required
            />
          </div>
          <div>
            <label htmlFor="optionB" className="block text-gray-600 font-medium mb-2">
              선택지 B
            </label>
            <input
              type="text"
              id="optionB"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="두 번째 선택지를 입력하세요"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-md shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            >
              {isPending ? '처리 중...' : '게임 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 