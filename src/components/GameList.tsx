'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_ABI } from '@/constants/abi';
import { BALANCE_GAME_ADDRESS } from '@/constants/addresses';
import CreateGame from './CreateGame';
import GameCard from './GameCard';

interface Game {
  question: string;
  optionA: string;
  optionB: string;
  createdAt: bigint;
  endTime: bigint;  // 마감 시간 추가
  creator: `0x${string}`;
  isActive: boolean;
  optionAAmount: bigint;
  optionBAmount: bigint;
  totalAmount: bigint;
  gameId: number; // 원래의 gameId를 저장
}

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);   // game list
  const [mounted, setMounted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  const fetchGames = useCallback(async () => {
    if (!publicClient) return;

    try {
      const gameCount = await publicClient.readContract({
        address: BALANCE_GAME_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getGamesCount',
      }) as bigint;

      const gamePromises = Array.from({ length: Number(gameCount) }, async (_, index) => {
        try {
          const game = await publicClient.readContract({
            address: BALANCE_GAME_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getGame',
            args: [BigInt(index)],
          }) as Game;

          if (game.question === '') return null;
          
          // gameId를 추가
          return {
            ...game,
            gameId: index
          };
        } catch (error) {
          console.error(`Error fetching game ${index}:`, error);
          return null;
        }
      });

      const games = await Promise.all(gamePromises);
      // null이 아닌 게임만 필터링하고 정렬
      const sortedGames = games
        .filter((game): game is Game => game !== null && game.question !== '')
        .sort((a, b) => {
          // 먼저 마감 여부로 정렬
          const isAEnded = Number(a.endTime) < Math.floor(Date.now() / 1000);
          const isBEnded = Number(b.endTime) < Math.floor(Date.now() / 1000);
          
          if (isAEnded !== isBEnded) {
            return isAEnded ? 1 : -1; // 마감되지 않은 게임이 위로
          }
          
          // 마감 여부가 같다면 총 금액으로 정렬
          const totalAmountA = Number(a.totalAmount);
          const totalAmountB = Number(b.totalAmount);
          return totalAmountB - totalAmountA;
        });
      setGames(sortedGames);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    setMounted(true);
    fetchGames();
    
    // 1초마다 게임 목록 새로고침
    const interval = setInterval(fetchGames, 1000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
            <GameCard key={game.gameId} game={game} index={index} />
          ))}
        </div>
      )}
      <CreateGame
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchGames}
      />
    </div>
  );
} 