// src/components/TopBar.js
import React from 'react';
import styled from 'styled-components';

const TopBarContainer = styled.div`
  background: rgba(26, 27, 31, 0.95);
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ViewAllButton = styled.button`
  background: #00F6FF;
  color: #0A0B0D;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #33F8FF;
    transform: translateY(-1px);
  }
`;

const TopBar = ({ onViewAll }) => (
  <TopBarContainer>
    <h1>Solana Betting</h1>
    <ViewAllButton onClick={onViewAll}>View All Threads</ViewAllButton>
  </TopBarContainer>
);