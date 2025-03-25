'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { BALANCE_GAME_ABI } from '@/constants/abi';
import { BALANCE_GAME_ADDRESS } from '@/constants/addresses';
import { parseEther } from 'viem';

interface VoteButtonProps {
  gameId: bigint;
  option: number;
}

export default function VoteButton({ gameId, option }: VoteButtonProps) {
  const [amount, setAmount] = useState('0.01');
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { writeContract, isPending } = useWriteContract();

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('지갑을 연결해주세요.');
      return;
    }

    try {
      await writeContract({
        address: BALANCE_GAME_ADDRESS,
        abi: BALANCE_GAME_ABI,
        functionName: 'vote',
        args: [gameId, option],
        value: parseEther(amount),
      });
      
      // 투표 후 게임 정보를 새로고침하도록 수정
      window.location.reload();
      alert('투표가 완료되었습니다!');
    } catch (error) {
      console.error('투표 중 오류가 발생했습니다:', error);
      alert('투표 중 오류가 발생했습니다.');
    }
  };

  if (!mounted) return null;

  return (
    <div className="mt-4">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="ETH 금액"
        className="w-full px-3 py-2 mb-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
        min="0"
        step="0.01"
      />
      <button
        onClick={handleVote}
        disabled={isPending}
        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {isPending ? '투표 중...' : '투표하기'}
      </button>
    </div>
  );
} 