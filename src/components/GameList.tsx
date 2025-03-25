'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { BALANCE_GAME_ABI } from '@/constants/abi';
import { BALANCE_GAME_ADDRESS } from '@/constants/addresses';
import VoteButton from './VoteButton';
import CreateGame from './CreateGame';

interface Game {
  question: string;
  optionA: string;
  optionB: string;
  createdAt: bigint;
  creator: `0x${string}`;
  isActive: boolean;
  optionAAmount: bigint;
  optionBAmount: bigint;
  totalAmount: bigint;
}

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);   // game list
  const [mounted, setMounted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const publicClient = usePublicClient();

  const { data: count } = useReadContract({ // contract를 프론트로 받아오기
    address: BALANCE_GAME_ADDRESS,
    abi: BALANCE_GAME_ABI,
    functionName: 'getGamesCount',
  });

  const refreshGames = useCallback(async () => {
    try {
      if (!count || !publicClient) return;

      const gamePromises = Array.from({ length: Number(count) }, (_, i) =>
        publicClient.readContract({
          address: BALANCE_GAME_ADDRESS,
          abi: BALANCE_GAME_ABI,
          functionName: 'getGame',
          args: [BigInt(i)],
        })
      );

      const games = await Promise.all(gamePromises);
      // 총 이더 금액이 많은 순으로 정렬
      const sortedGames = games.sort((a, b) => {
        const totalAmountA = Number(a.totalAmount);
        const totalAmountB = Number(b.totalAmount);
        return totalAmountB - totalAmountA;
      });
      setGames(sortedGames);
    } catch (error) {
      console.error('게임 목록을 가져오는데 실패했습니다:', error);
    }
  }, [count, publicClient]);

  useEffect(() => {
    setMounted(true);
    refreshGames();
  }, [refreshGames]);

  // 주기적으로 게임 정보 업데이트 (선택사항)
  useEffect(() => {
    const interval = setInterval(refreshGames, 5000); // 5초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">🎮 밸런스 게임 목록</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2"
        >
          ✨ 게임 만들기
        </button>
      </div>
      {games.length === 0 ? (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-lg">아직 생성된 게임이 없습니다 ✨</p>
        </div>
      ) : (
        <div className="space-y-6">
          {games.map((game, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                  {index === 0 && '🥇 '}
                  {index === 1 && '🥈 '}
                  {index === 2 && '🥉 '}
                  {game.question}
                  {index === 0 && <span className="text-sm font-normal text-yellow-600 animate-pulse">인기 1위!</span>}
                </h3>
                <p className="text-indigo-600 font-semibold bg-indigo-50/80 px-4 py-2 rounded-full">
                  총 {Number(game.totalAmount) === 0 ? "0" : (Number(game.totalAmount) / 10**18).toString().replace(/\.?0+$/, '')} ETH
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-700 font-bold text-lg">{game.optionA}</p>
                    <p className="text-indigo-600 font-semibold">
                      {Number(game.optionAAmount) === 0 ? "0" : (Number(game.optionAAmount) / 10**18).toString().replace(/\.?0+$/, '')} ETH
                    </p>
                  </div>
                  <VoteButton gameId={BigInt(index)} option={true} />
                </div>
                <div className="p-5 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-700 font-bold text-lg">{game.optionB}</p>
                    <p className="text-indigo-600 font-semibold">
                      {Number(game.optionBAmount) === 0 ? "0" : (Number(game.optionBAmount) / 10**18).toString().replace(/\.?0+$/, '')} ETH
                    </p>
                  </div>
                  <VoteButton gameId={BigInt(index)} option={false} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <CreateGame
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refreshGames}
      />
    </div>
  );
} 