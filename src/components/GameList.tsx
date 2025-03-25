'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { BALANCE_GAME_ABI } from '@/constants/abi';
import { BALANCE_GAME_ADDRESS } from '@/constants/addresses';
import VoteButton from './VoteButton';

interface Game {
  question: string;
  optionA: string;
  optionB: string;
  createdAt: bigint;
  creator: `0x${string}`;
  isActive: boolean;
  optionAVotes: bigint;
  optionBVotes: bigint;
  totalAmount: bigint;
}

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);
  const [mounted, setMounted] = useState(false);
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
      setGames(games);
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
    <div className="max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6 text-white">밸런스 게임 목록</h2>
      {games.length === 0 ? (
        <div className="text-center py-8 bg-gray-800 rounded-lg">
          <p className="text-gray-300">아직 생성된 게임이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((game, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-white">{game.question}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-gray-200 font-medium">{game.optionA}</p>
                  <p className="text-gray-400 mt-2">투표 수: {game.optionAVotes.toString()}</p>
                  <VoteButton gameId={BigInt(index)} option={0} />
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-gray-200 font-medium">{game.optionB}</p>
                  <p className="text-gray-400 mt-2">투표 수: {game.optionBVotes.toString()}</p>
                  <VoteButton gameId={BigInt(index)} option={1} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 