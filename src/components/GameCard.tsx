import VoteButton from './VoteButton';
import { useWriteContract, useAccount, usePublicClient, useReadContract } from 'wagmi';
import { CONTRACT_ABI } from '@/constants/abi';
import { BALANCE_GAME_ADDRESS } from '@/constants/addresses';

interface Game {
  question: string;
  optionA: string;
  optionB: string;
  createdAt: bigint;
  endTime: bigint;
  creator: string;
  isActive: boolean;
  optionAAmount: bigint;
  optionBAmount: bigint;
  totalAmount: bigint;
  gameId: number;
}

interface GameCardProps {
  game: Game;
  index: number;
}

export default function GameCard({ game, index }: GameCardProps) {
  const isEnded = Number(game.endTime) < Math.floor(Date.now() / 1000);
  const { address } = useAccount();
  const { writeContractAsync: writeContract, isPending } = useWriteContract();
  const publicClient = usePublicClient();

  // 사용자의 투표 정보 조회
  const { data: voteData } = useReadContract({
    address: BALANCE_GAME_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getVote',
    args: [BigInt(game.gameId), address as `0x${string}`],
    query: {
      enabled: !!address && isEnded
    }
  });

  const calculateReward = () => {
    if (!voteData) return 0;
    
    const isOptionAWinner = Number(game.optionAAmount) > Number(game.optionBAmount);
    const userVoteAmount = isOptionAWinner ? Number(voteData.optionAAmount) : Number(voteData.optionBAmount);
    const totalWinningAmount = isOptionAWinner ? Number(game.optionAAmount) : Number(game.optionBAmount);
    
    if (userVoteAmount === 0 || totalWinningAmount === 0) return 0;
    
    return (userVoteAmount * Number(game.totalAmount)) / totalWinningAmount;
  };

  const canClaimReward = () => {
    if (!voteData) return false;
    
    const isOptionAWinner = Number(game.optionAAmount) > Number(game.optionBAmount);
    const userVoteAmount = isOptionAWinner ? Number(voteData.optionAAmount) : Number(voteData.optionBAmount);
    
    return userVoteAmount > 0 && voteData.isOptionA === isOptionAWinner;
  };

  const reward = calculateReward();
  const isClaimable = canClaimReward();

  const handleClaimReward = async () => {
    if (!address) {
      alert('지갑을 연결해주세요.');
      return;
    }

    try {
      console.log('게임 정보:', {
        gameId: game.gameId,
        endTime: Number(game.endTime),
        currentTime: Math.floor(Date.now() / 1000),
        isEnded: Number(game.endTime) < Math.floor(Date.now() / 1000),
        optionAAmount: Number(game.optionAAmount),
        optionBAmount: Number(game.optionBAmount),
        totalAmount: Number(game.totalAmount)
      });

      console.log('투표 정보:', voteData);

      const hash = await writeContract({
        address: BALANCE_GAME_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimReward',
        args: [BigInt(game.gameId)],
      });

      if (!publicClient) return;

      alert('보상 청구가 전송되었습니다. 트랜잭션이 완료될 때까지 기다려주세요.');
      await publicClient.waitForTransactionReceipt({ hash });
      
      alert('보상을 성공적으로 받았습니다!');
      window.location.reload();
    } catch (error: any) {
      console.error('보상 청구 중 오류가 발생했습니다:', error);
      console.error('상세 에러:', {
        message: error.message,
        cause: error.cause,
        data: error.data
      });
      
      let errorMessage = '보상 청구 중 오류가 발생했습니다.';
      
      if (error.message?.includes('Game does not exist')) {
        errorMessage = '존재하지 않는 게임입니다.';
      } else if (error.message?.includes('Game has not ended')) {
        errorMessage = '아직 마감되지 않은 게임입니다.';
      } else if (error.message?.includes('No votes found')) {
        errorMessage = '이 게임에 투표하지 않았습니다.';
      } else if (error.message?.includes('Not a winner')) {
        errorMessage = '승리한 선택지에 투표하지 않았습니다.';
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div key={game.gameId} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {index < 3 && (
              <span className="mr-2">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
              </span>
            )}
            {game.question}
          </h3>
          <p className={`text-sm ${isEnded ? 'text-red-500' : 'text-green-500'}`}>
            {isEnded ? '마감된 게임' : `남은 시간: ${Math.floor((Number(game.endTime) - Math.floor(Date.now() / 1000)) / 60)}분 ${(Number(game.endTime) - Math.floor(Date.now() / 1000)) % 60}초`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-indigo-600">
            {Number(game.totalAmount) === 0 ? "0" : (Number(game.totalAmount) / 10**18).toString().replace(/\.?0+$/, '')} ETH
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className={`p-5 backdrop-blur-sm rounded-xl border transition-all duration-300 ${
          Number(game.optionAAmount) > Number(game.optionBAmount)
            ? 'bg-blue-100/80 border-blue-300 hover:border-blue-400 shadow-md shadow-blue-100'
            : 'bg-slate-50/80 border-gray-200 hover:border-indigo-300'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <p className={`text-gray-700 font-bold text-lg ${
              Number(game.optionAAmount) > Number(game.optionBAmount)
                ? 'text-blue-800'
                : ''
            }`}>
              {game.optionA}
              {Number(game.optionAAmount) > Number(game.optionBAmount) && (
                <span className="ml-2 text-blue-600 animate-pulse">✨</span>
              )}
            </p>
            <p className={`font-semibold ${
              Number(game.optionAAmount) > Number(game.optionBAmount)
                ? 'text-blue-600'
                : 'text-indigo-600'
            }`}>
              {Number(game.optionAAmount) === 0 ? "0" : (Number(game.optionAAmount) / 10**18).toString().replace(/\.?0+$/, '')} ETH
            </p>
          </div>
          {isEnded ? (
            Number(game.optionAAmount) > Number(game.optionBAmount) && isClaimable ? (
              <button
                onClick={handleClaimReward}
                disabled={isPending}
                className="w-full py-2 px-4 rounded-md text-white font-medium bg-green-500 hover:bg-green-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPending ? '보상 받는 중...' : `보상 받기 🎁 (${reward === 0 ? "0" : (reward / 10**18).toFixed(2)} ETH)`}
              </button>
            ) : (
              <div className="w-full py-2 px-4 rounded-md text-gray-500 text-center">
                {Number(game.optionAAmount) > Number(game.optionBAmount) ? '🎉 당첨!' : '🍀 다음 기회에~'}
              </div>
            )
          ) : (
            <VoteButton gameId={BigInt(game.gameId)} option={true} disabled={isEnded} />
          )}
        </div>
        <div className={`p-5 backdrop-blur-sm rounded-xl border transition-all duration-300 ${
          Number(game.optionBAmount) > Number(game.optionAAmount)
            ? 'bg-red-100/80 border-red-300 hover:border-red-400 shadow-md shadow-red-100'
            : 'bg-slate-50/80 border-gray-200 hover:border-indigo-300'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <p className={`text-gray-700 font-bold text-lg ${
              Number(game.optionBAmount) > Number(game.optionAAmount)
                ? 'text-red-800'
                : ''
            }`}>
              {game.optionB}
              {Number(game.optionBAmount) > Number(game.optionAAmount) && (
                <span className="ml-2 text-red-600 animate-pulse">✨</span>
              )}
            </p>
            <p className={`font-semibold ${
              Number(game.optionBAmount) > Number(game.optionAAmount)
                ? 'text-red-600'
                : 'text-indigo-600'
            }`}>
              {Number(game.optionBAmount) === 0 ? "0" : (Number(game.optionBAmount) / 10**18).toString().replace(/\.?0+$/, '')} ETH
            </p>
          </div>
          {isEnded ? (
            Number(game.optionBAmount) > Number(game.optionAAmount) && isClaimable ? (
              <button
                onClick={handleClaimReward}
                disabled={isPending}
                className="w-full py-2 px-4 rounded-md text-white font-medium bg-green-500 hover:bg-green-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPending ? '보상 받는 중...' : `보상 받기 🎁 (${reward === 0 ? "0" : (reward / 10**18).toFixed(2)} ETH)`}
              </button>
            ) : (
              <div className="w-full py-2 px-4 rounded-md text-gray-500 text-center">
                {Number(game.optionBAmount) > Number(game.optionAAmount) ? '🎉 당첨!' : '🍀 다음 기회에~'}
              </div>
            )
          ) : (
            <VoteButton gameId={BigInt(game.gameId)} option={false} disabled={isEnded} />
          )}
        </div>
      </div>
    </div>
  );
} 