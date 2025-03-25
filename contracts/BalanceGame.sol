// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

// Ownable 상속 - 특별한 권한을 가지는 소유자를 생성,구별할 수 있음.
contract BalanceGame is Ownable {
    struct Vote {
        bool isOptionA; // A or B 중 하나를 선택
        uint256 optionAAmount; // A 선택지에 투표한 금액
        uint256 optionBAmount; // B 선택지에 투표한 금액
    }

    struct Game {
        string question; // 질문
        string optionA; // 선택지 A
        string optionB; // 선택지 B

        uint256 createdAt;
        uint256 endTime;  // 마감 시간 추가
        address creator;
        bool isActive;
        uint256 optionAAmount;  // A 선택지에 투표된 총 금액
        uint256 optionBAmount;  // B 선택지에 투표된 총 금액
        uint256 totalAmount;
    }

    Game[] public games;
    mapping(uint256 => mapping(address => Vote)) public votes;  // gameID -> (voter -> (option,eth amount))
    
    event GameCreated(uint256 indexed gameId, string question, string optionA, string optionB, address creator, uint256 endTime);
    event VoteCast(uint256 indexed gameId, address indexed voter, bool isOptionA, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    // 새로운 게임을 만들어 게임 리스트(gmaes)에 저장
    function createGame(
        string memory _question,
        string memory _optionA,
        string memory _optionB,
        uint256 _durationInMinutes  // 마감 시간을 분 단위로 받음
    ) external {
        require(_durationInMinutes > 0 && _durationInMinutes <= 60, "Duration must be between 1 and 60 minutes");
        
        uint256 endTime = block.timestamp + (_durationInMinutes * 1 minutes);
        
        games.push(Game({
            question: _question,
            optionA: _optionA,
            optionB: _optionB,
            createdAt: block.timestamp,
            endTime: endTime,
            creator: msg.sender,
            isActive: true,
            optionAAmount: 0,
            optionBAmount: 0,
            totalAmount: 0
        }));
        
        // 게임을 만들고 이벤트 발생
        emit GameCreated(games.length - 1, _question, _optionA, _optionB, msg.sender, endTime);
    }
    
    // 투표를 해주는 함수 : (gmaId, 선택한 option)
    function vote(uint256 _gameId, bool _isOptionA) external payable {
        require(_gameId < games.length, "Game does not exist");
        require(games[_gameId].isActive, "Game is not active");
        require(block.timestamp <= games[_gameId].endTime, "Game has ended");
        require(msg.value > 0, "Must send some ETH to vote");

        Game storage game = games[_gameId];
        Vote storage userVote = votes[_gameId][msg.sender];
        
        if (_isOptionA) {
            game.optionAAmount += msg.value;
            userVote.optionAAmount += msg.value;
        } else {
            game.optionBAmount += msg.value;
            userVote.optionBAmount += msg.value;
        }
        
        game.totalAmount += msg.value;
        userVote.isOptionA = _isOptionA;  // 마지막 선택 저장
        
        emit VoteCast(_gameId, msg.sender, _isOptionA, msg.value);
    }
    
    // gameID를 통해 game을 반환
    function getGame(uint256 _gameId) external view returns (Game memory) {
        require(_gameId < games.length, "Game does not exist");
        return games[_gameId];
    }
    
    // 게임 개수 반환
    function getGamesCount() external view returns (uint256) { 
        return games.length;
    }

    // gameID와 투표자를 통해 투표 기록을 반환
    function getVote(uint256 _gameId, address _voter) external view returns (Vote memory) {
        return votes[_gameId][_voter];
    }

    function getGameInEther(uint256 _gameId) external view returns (
        string memory question,
        string memory optionA,
        string memory optionB,
        uint256 createdAt,
        uint256 endTime,
        address creator,
        bool isActive,
        uint256 optionAAmount,
        uint256 optionBAmount,
        uint256 totalAmount
    ) {
        require(_gameId < games.length, "Game does not exist");
        Game memory game = games[_gameId];
        return (
            game.question,
            game.optionA,
            game.optionB,
            game.createdAt,
            game.endTime,
            game.creator,
            game.isActive,
            game.optionAAmount,
            game.optionBAmount,
            game.totalAmount
        );
    }
} 