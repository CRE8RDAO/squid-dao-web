import { Typography } from "@material-ui/core";
import React, { useEffect, useMemo, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import arrowLeftIcon from "../../assets/icons/arrow-left.svg";
import arrowRightIcon from "../../assets/icons/arrow-right.svg";
import { useWeb3Context } from "../../hooks";
import { useAuctionContext, BidData } from "../../hooks/auctionContext";
import useAuctionData from "../../hooks/useAuctionData";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { shorten, formatEther } from "../../helpers";
import { useReverseENSLookUp } from "../../helpers/ensLookup";
import useAuctionImage from "../../helpers/useAuctionImages";
import BidInput from "./BidInput";
import { useModalContext } from "./Modal";

interface AuctionProps {
  auctionId: number;
}

const Bid: React.FC<AuctionProps> = ({ auctionId }) => {
  const history = useHistory();

  const onNextAuction = () => history.push(`/auction/${auctionId + 1}`);
  const onPrevAuction = () => history.push(`/auction/${auctionId - 1}`);

  const { lastAuctionId } = useAuctionContext();
  const auctionData = useAuctionData(auctionId);

  const auction = useAuctionData(auctionId);
  const amount = formatEther(auction.amount);

  const { onPresent } = useModalContext();
  const historyBids = useMemo(
    () => (
      <>
        {auction.bids
          .sort((a, b) => {
            return b.bidTime.getTime() - a.bidTime.getTime();
          })
          .map((bid, idx) => (
            <BidRecord key={idx} bid={bid} />
          ))}
      </>
    ),
    [auction],
  );

  return (
    <div className="row gy-4">
      <div className="col col-auto d-flex flex-column align-items-center">
        <Art src={useAuctionImage(auctionId)} />
        <ArtNav
          isFirst={auctionId === 0}
          isLast={auctionId === lastAuctionId}
          onPrevAuctionClick={onPrevAuction}
          onNextAuctionClick={onNextAuction}
        />
      </div>
      <div className="col d-flex flex-column">
        <div className="row mb-3">
          <div className="col">
            <Typography variant="h2" component="div">
              SQUID {auctionId}
            </Typography>
          </div>
        </div>
        <div className="row gx-5 gy-3 mb-3">
          <div className="col col-auto mb-2 mb-md-0">
            <CurrentBid bid={amount.toNumber()} />
          </div>
          <div className="col col-auto p-0" style={{ width: "1px", backgroundColor: "black" }} />
          <div className="col">
            {auction.settled ? <Winner address={auction.bidder} /> : <BidTimer date={auction.endTime} />}
          </div>
        </div>
        <Row className="mb-3">{auctionId === lastAuctionId && <BidInput auction={auctionData} />}</Row>
        <Row className="mb-3">
          <Col className="d-flex flex-column">
            <div className="d-flex flex-column">
              {auction.bids
                .sort((a, b) => {
                  return b.bidTime.getTime() - a.bidTime.getTime();
                })
                .slice(0, 3)
                .map((bid, idx) => (
                  <BidRecord key={idx} bid={bid} />
                ))}
            </div>
          </Col>
        </Row>
        <Row>
          <Col onClick={() => onPresent("History Bids", historyBids)}>
            <Typography variant="h4" component="div" style={{ cursor: "pointer" }}>
              View History
            </Typography>
          </Col>
        </Row>
      </div>
    </div>
  );
};

const CurrentBid: React.FC<{ bid: number }> = ({ bid }) => {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", lineHeight: "1.125rem" }}>Current Bid</div>
      <div style={{ fontSize: "2rem", lineHeight: "3rem", fontWeight: 700 }}>{bid.toFixed(2)} ETH</div>
    </div>
  );
};

const BidTimer: React.FC<{ date: Date }> = ({ date }) => {
  const getCountdown = () => {
    const now = Math.floor(new Date().getTime() / 1000);
    const end = Math.floor(date.getTime() / 1000);

    if (now >= end) {
      return [0, 0, 0];
    }

    const d = end - now;
    const hours = Math.floor(d / 3600);
    const minutes = Math.floor((d - hours * 3600) / 60);
    const seconds = d - Math.floor(d / 60) * 60;
    return [hours, minutes, seconds];
  };

  const [countdown, setCountdown] = useState(getCountdown());

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);
    return () => clearInterval(id);
  }, [getCountdown]);

  return (
    <div>
      <div style={{ fontSize: "0.75rem", lineHeight: "1.125rem" }}>Auction ending in</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Timer t={countdown[0]} unit="Hours" />
        <Timer t={countdown[1]} unit="Minutes" />
        <Timer t={countdown[2]} unit="Seconds" />
      </div>
    </div>
  );
};

const Winner: React.FC<{ address: string }> = ({ address }) => {
  const ens = useReverseENSLookUp(address);
  return (
    <div>
      <Typography variant="h6" component="div">
        Winner
      </Typography>
      <Typography variant="h2" component="div">
        {address ? (ens ? ens : shorten(address)) : "No Winner"}
      </Typography>
    </div>
  );
};

const Timer: React.FC<{ t: number; unit: string }> = ({ t, unit }) => {
  return (
    <div>
      <div style={{ fontSize: "2rem", fontWeight: 700, lineHeight: "3rem" }}>{t}</div>
      <div style={{ fontSize: "0.75rem", lineHeight: "1.125rem", color: "#8F8F8F" }}>{unit}</div>
    </div>
  );
};

const BidRecord: React.FC<{ bid: BidData }> = ({ bid }) => {
  const { chainID } = useWeb3Context();

  const openExplorer = (txHash: string) => {
    const url = chainID === 4 ? "https://rinkeby.etherscan.io/tx/" + txHash : "https://etherscan.io/tx/" + txHash;
    window.open(url);
  };
  const ens = useReverseENSLookUp(bid.bidder);

  return (
    <BidRecordWrapper>
      <span style={{ fontSize: "0.75rem" }}>{ens ? ens : shorten(bid.bidder)}</span>
      <span style={{ flexGrow: 1, textAlign: "end", fontSize: "1rem", fontWeight: 500 }}>
        Ξ {formatEther(bid.bidAmount).toFixed(4)}
      </span>
      <FontAwesomeIcon
        icon={faExternalLinkAlt}
        className="ms-3"
        style={{ fontSize: "1rem" }}
        onClick={() => openExplorer(bid.txHash)}
      />
    </BidRecordWrapper>
  );
};

interface ArtNavProps {
  isFirst: boolean;
  isLast: boolean;
  onPrevAuctionClick: () => void;
  onNextAuctionClick: () => void;
}

const ArtNav: React.FC<ArtNavProps> = props => {
  const { isFirst, isLast, onPrevAuctionClick, onNextAuctionClick } = props;

  return (
    <div>
      <NavButton onClick={onPrevAuctionClick} disabled={isFirst}>
        <img src={arrowLeftIcon} />
      </NavButton>
      <NavButton onClick={onNextAuctionClick} disabled={isLast}>
        <img src={arrowRightIcon} />
      </NavButton>
    </div>
  );
};

const NavButton = styled.button`
  background-color: transparent;
  border: none;
  color: black;
  font-size: xx-large;

  &:disabled {
    opacity: 0.5;
  }
`;

const Art = styled.img`
  width: 100%;
  max-width: 400px;
  //height: 440px;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
`;

const BidRecordWrapper = styled.div`
  height: 2.75rem;
  display: flex;
  background: #f3f3f3;
  margin-top: 0.5rem;
  border-radius: 10px;
  align-items: center;
  padding: 6px 10px;

  &:first-child {
    margin-top: 0;
  }
`;

export default Bid;
