// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VelantraEscrow
/// @notice Minimal escrow contract for Velantra farmer-buyer orders.
/// Buyer funds are locked on order acceptance and released to the farmer
/// once delivery is confirmed, or refunded to the buyer if cancelled.
contract VelantraEscrow {
    enum Status { None, Locked, Released, Refunded }

    struct Escrow {
        address farmer;
        address buyer;
        uint256 amount;
        Status status;
    }

    address public owner;
    mapping(uint256 => Escrow) public escrows; // orderId => Escrow

    event PaymentLocked(uint256 indexed orderId, address indexed buyer, address indexed farmer, uint256 amount);
    event PaymentReleased(uint256 indexed orderId, address indexed farmer, uint256 amount);
    event PaymentRefunded(uint256 indexed orderId, address indexed buyer, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Buyer (or the platform, on the buyer's behalf) locks funds for an order.
    function lockPayment(uint256 orderId, address farmer, address buyer) external payable {
        require(escrows[orderId].status == Status.None, "Escrow already exists");
        require(msg.value > 0, "Amount must be > 0");

        escrows[orderId] = Escrow({
            farmer: farmer,
            buyer: buyer,
            amount: msg.value,
            status: Status.Locked
        });

        emit PaymentLocked(orderId, buyer, farmer, msg.value);
    }

    /// @notice Releases locked funds to the farmer once delivery is confirmed.
    /// Restricted to the platform owner acting on confirmed delivery events;
    /// a production version should verify an oracle/delivery-confirmation signal.
    function releasePayment(uint256 orderId) external onlyOwner {
        Escrow storage e = escrows[orderId];
        require(e.status == Status.Locked, "Not locked");

        e.status = Status.Released;
        (bool sent, ) = e.farmer.call{value: e.amount}("");
        require(sent, "Transfer to farmer failed");

        emit PaymentReleased(orderId, e.farmer, e.amount);
    }

    /// @notice Refunds locked funds to the buyer (order cancelled / dispute).
    function refundPayment(uint256 orderId) external onlyOwner {
        Escrow storage e = escrows[orderId];
        require(e.status == Status.Locked, "Not locked");

        e.status = Status.Refunded;
        (bool sent, ) = e.buyer.call{value: e.amount}("");
        require(sent, "Refund to buyer failed");

        emit PaymentRefunded(orderId, e.buyer, e.amount);
    }

    function getEscrow(uint256 orderId) external view returns (address, address, uint256, Status) {
        Escrow memory e = escrows[orderId];
        return (e.farmer, e.buyer, e.amount, e.status);
    }
}
