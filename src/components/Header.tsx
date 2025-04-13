import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const HeaderContainer = styled.header`
  background: white;
  padding: 15px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Logo = styled.h1`
  font-family: 'Poppins', sans-serif;
  font-size: 1.8rem;
  font-weight: 800;
  color: #4361ee;
  margin: 0;
`;

const HeaderDate = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 0.9rem;

  i {
    color: #FF5757;
  }
`;

const Navigation = styled.nav<{ $isOpen?: boolean }>`
  display: flex;
  gap: 30px;
  align-items: center;

  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    flex-direction: column;
    padding: 20px;
    gap: 15px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
`;

const NavItem = styled(Link)`
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: #2D3748;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    font-size: 1.1rem;
    color: #4361ee;
  }

  &:hover {
    background: rgba(67, 97, 238, 0.1);
    color: #4361ee;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    padding: 12px;
  }
`;

const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #4361ee;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(67, 97, 238, 0.1);
  }

  @media (max-width: 768px) {
    display: block;
  }
`;

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Get current date
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = today.toLocaleDateString('en-US', options);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <HeaderContainer>
      <HeaderTop>
        <LogoContainer>
          <Logo>READLETA</Logo>
          <HeaderDate>
            <i className="far fa-calendar-alt"></i>
            {formattedDate}
          </HeaderDate>
        </LogoContainer>
        <HamburgerButton onClick={toggleMenu}>
          <i className={`fas fa-${isMenuOpen ? 'times' : 'bars'}`}></i>
        </HamburgerButton>
        <Navigation $isOpen={isMenuOpen}>
          <NavItem to="/about" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-info-circle"></i>
            Apie mus
          </NavItem>
          <NavItem to="/mission" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-bullseye"></i>
            Misija
          </NavItem>
          <NavItem to="/price" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-tag"></i>
            Kaina
          </NavItem>
        </Navigation>
      </HeaderTop>
    </HeaderContainer>
  );
};

export default Header;
