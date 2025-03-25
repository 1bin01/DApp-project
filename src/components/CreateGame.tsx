'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { BALANCE_GAME_ABI } from '@/constants/abi';
import { BALANCE_GAME_ADDRESS } from '@/constants/addresses';

export default function CreateGame() {
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
    } catch (error) {
      console.error('게임 생성 중 오류가 발생했습니다:', error);
      alert('게임 생성 중 오류가 발생했습니다.');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-white">밸런스 게임 만들기</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200">질문</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200">선택지 A</label>
          <input
            type="text"
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200">선택지 B</label>
          <input
            type="text"
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={!writeContract || isPending}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-500"
        >
          {isPending ? '생성 중...' : '게임 생성하기'}
        </button>
      </form>
    </div>
  );
} 