// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Native MON rewards funded before a run. The verifier cannot withdraw sponsor funds.
/// A proof is bound to a runner, a challenge, a session, this contract and this chain.
contract MonadChallengeEscrow is EIP712, ReentrancyGuard {
    struct Challenge { address sponsor; uint96 reward; uint64 endsAt; uint32 targetMeters; uint32 slots; uint32 claimed; uint256 remaining; string title; }
    struct RunProof { uint256 challengeId; address runner; bytes32 sessionId; uint32 distanceMeters; uint64 durationSeconds; uint64 deadline; }
    bytes32 public constant PROOF_TYPEHASH = keccak256("RunProof(uint256 challengeId,address runner,bytes32 sessionId,uint32 distanceMeters,uint64 durationSeconds,uint64 deadline)");
    address public immutable verifier;
    uint256 public challengeCount;
    mapping(uint256 => Challenge) public challenges;
    mapping(bytes32 => bool) public sessionUsed;
    mapping(uint256 => mapping(address => bool)) public claimedBy;
    uint256 public constant CLAIM_GRACE = 1 days;
    error InvalidChallenge(); error InvalidProof(); error AlreadyClaimed(); error Expired(); error TransferFailed(); error NotSponsor();
    event ChallengeCreated(uint256 indexed id, address indexed sponsor, string title, uint256 reward, uint32 slots, uint32 targetMeters, uint64 endsAt);
    event RewardClaimed(uint256 indexed id, address indexed runner, bytes32 indexed sessionId, uint256 amount);
    event Refunded(uint256 indexed id, address indexed sponsor, uint256 amount);
    constructor(address verifier_) EIP712("StepUpMonadChallenge", "1") { require(verifier_ != address(0)); verifier = verifier_; }
    function createChallenge(string calldata title, uint32 targetMeters, uint32 slots, uint64 endsAt) external payable returns(uint256 id) {
        if(bytes(title).length == 0 || bytes(title).length > 80 || targetMeters < 100 || targetMeters > 100000 || slots == 0 || slots > 10000 || msg.value == 0 || msg.value % slots != 0 || msg.value / slots > type(uint96).max || endsAt <= block.timestamp || endsAt > block.timestamp + 90 days) revert InvalidChallenge();
        id = ++challengeCount;
        challenges[id] = Challenge(msg.sender, uint96(msg.value/slots), endsAt, targetMeters, slots, 0, msg.value, title);
        emit ChallengeCreated(id,msg.sender,title,msg.value/slots,slots,targetMeters,endsAt);
    }
    function claim(RunProof calldata proof, bytes calldata signature) external nonReentrant {
        Challenge storage c = challenges[proof.challengeId];
        if(c.sponsor == address(0) || proof.runner == address(0) || proof.sessionId == bytes32(0) || proof.distanceMeters < c.targetMeters || proof.durationSeconds < 30) revert InvalidProof();
        if(block.timestamp > proof.deadline || block.timestamp > uint256(c.endsAt)+CLAIM_GRACE) revert Expired();
        if(sessionUsed[proof.sessionId] || claimedBy[proof.challengeId][proof.runner] || c.claimed >= c.slots) revert AlreadyClaimed();
        bytes32 hash = _hashTypedDataV4(keccak256(abi.encode(PROOF_TYPEHASH, proof.challengeId, proof.runner, proof.sessionId, proof.distanceMeters, proof.durationSeconds, proof.deadline)));
        if(ECDSA.recover(hash, signature) != verifier) revert InvalidProof();
        sessionUsed[proof.sessionId] = true; claimedBy[proof.challengeId][proof.runner] = true; c.claimed++; c.remaining -= c.reward;
        (bool ok,) = payable(proof.runner).call{value:c.reward}(""); if(!ok) revert TransferFailed();
        emit RewardClaimed(proof.challengeId,proof.runner,proof.sessionId,c.reward);
    }
    function refund(uint256 id) external nonReentrant {
        Challenge storage c = challenges[id]; if(msg.sender != c.sponsor) revert NotSponsor();
        if(block.timestamp <= uint256(c.endsAt)+CLAIM_GRACE) revert Expired();
        uint256 amount = c.remaining; c.remaining=0;
        (bool ok,) = payable(msg.sender).call{value:amount}(""); if(!ok) revert TransferFailed();
        emit Refunded(id,msg.sender,amount);
    }
}
