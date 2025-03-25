// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

// Ownable 상속 - 특별한 권한을 가지는 소유자를 생성,구별할 수 있음.
contract BalanceGame is Ownable {
    struct Vote {
        bool isOptionA; // A or B 중 하나를 선택
        uint256 amount; // 투표 금액
    }

    struct Game {
        string question; // 질문
        string optionA; // 선택지 A
        string optionB; // 선택지 B

        uint256 createdAt;
        address creator;
        bool isActive;
        uint256 optionAVotes;
        uint256 optionBVotes;
        uint256 totalAmount;
    }

    Game[] public games;
    mapping(uint256 => mapping(address => Vote)) public votes;  // gameID -> (voter -> (option,eth amount))
    
    event GameCreated(uint256 indexed gameId, string question, string optionA, string optionB, address creator);
    event VoteCast(uint256 indexed gameId, address indexed voter, bool isOptionA, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    // 새로운 게임을 만들어 게임 리스트(gmaes)에 저장
    function createGame(string memory _question, string memory _optionA, string memory _optionB) external {
        games.push(Game({
            question: _question,
            optionA: _optionA,
            optionB: _optionB,
            createdAt: block.timestamp,
            creator: msg.sender,
            isActive: true,
            optionAVotes: 0,
            optionBVotes: 0,
            totalAmount: 0
        }));
        
        // 게임을 만들고 이벤트 발생
        emit GameCreated(games.length - 1, _question, _optionA, _optionB, msg.sender);
    }
    
    // 투표를 해주는 함수 : (gmaId, 선택한 option)
    function vote(uint256 _gameId, bool _isOptionA) external payable {
        require(_gameId < games.length, "Game does not exist");
        require(games[_gameId].isActive, "Game is not active");
        require(msg.value > 0, "Must send some ETH to vote");
        require(votes[_gameId][msg.sender].amount == 0, "Already voted");   // 중복 투표를 가능하게 할 것인가? <- 나중에 수정할 필요o

        Game storage game = games[_gameId];
        
        if (_isOptionA) {
            game.optionAVotes += 1;
        } else {
            game.optionBVotes += 1;
        }
        
        game.totalAmount += msg.value;  // 게임에 걸린 전체 ETH 양
        votes[_gameId][msg.sender] = Vote({ // 투표 상태 update
            isOptionA: _isOptionA,
            amount: msg.value
        });
        
        emit VoteCast(_gameId, msg.sender, _isOptionA, msg.value);  // 투표 이벤트 발생
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
} 