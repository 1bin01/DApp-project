'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useAccount, usePublicClient } from 'wagmi';
// abi 받아오기
import { CONTRACT_ABI } from '@/constants/abi';
// contract address 받아오기
import { BALANCE_GAME_ADDRESS } from '@/constants/addresses';
import { parseEther } from 'viem';

interface VoteButtonProps {
  gameId: bigint;
  option: boolean;
  disabled?: boolean;
}

export default function VoteButton({ gameId, option, disabled }: VoteButtonProps) {
  const [amount, setAmount] = useState('0.01'); // 기본 투표 금액을 0.01로 설정
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { writeContractAsync: writeContract, isPending } = useWriteContract();

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('지갑을 연결해주세요.');
      return;
    }

    try {
      const hash = await writeContract({
        address: BALANCE_GAME_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'vote',
        args: [gameId, option],
        value: parseEther(amount),
      });

      if (!publicClient) return;

      alert('투표가 전송되었습니다. 트랜잭션이 완료될 때까지 기다려주세요.');
      await publicClient.waitForTransactionReceipt({ hash });
      
      alert('투표가 완료되었습니다!');
      window.location.reload();
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
        className="w-full px-3 py-2 mb-2 bg-white border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
        min="0"
        step="0.01"
      />
      <button
        onClick={handleVote}
        disabled={isPending || disabled}
        className={`w-full py-2 px-4 rounded-md text-white font-medium transition-all duration-300 ${
          disabled
            ? 'bg-gray-400 cursor-not-allowed'
            : option
            ? 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 shadow-sm hover:shadow'
            : 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 shadow-sm hover:shadow'
        }`}
      >
        {isPending ? '투표 중...' : option ? 'A 선택하기' : 'B 선택하기'}
      </button>
    </div>
  );
} 