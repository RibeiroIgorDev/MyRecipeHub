import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(5, 9, 20, 0.92);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

export const Panel = styled.div`
  width: min(1160px, 100%);
  max-height: calc(100vh - 3rem);
  background: #0b1222;
  border-radius: 24px;
  box-shadow: 0 32px 100px rgba(0, 0, 0, 0.35);
  padding: 1.5rem;
  position: relative;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

export const LoadingPanel = styled(Panel)`
  display: grid;
  place-items: center;
  min-height: 220px;
`;

export const LoadingMessage = styled.div`
  color: #fff;
  font-size: 1.15rem;
  text-align: center;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1.5rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

export const Header = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const ImageContainer = styled.div`
  min-height: 280px;
  border-radius: 22px;
  background-size: cover;
  background-position: center;
  background-image: ${(props) => (props.src ? `url(${props.src})` : 'none')};
  overflow: hidden;
  position: relative;
`;

export const Summary = styled.div`
  min-width: 0;

  h2 {
    margin: 0 0 0.75rem;
    font-size: clamp(2rem, 2.5vw, 2.5rem);
    word-break: break-word;
  }

  p {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.75;
    word-break: break-word;
  }
`;

export const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  min-width: 0;

  span {
    background: rgba(255, 255, 255, 0.08);
    color: #f6f6f6;
    border-radius: 999px;
    padding: 0.55rem 0.85rem;
    font-size: 0.9rem;
  }
`;

export const Body = styled.div`
  margin-top: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }

  section {
    min-width: 0;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.25rem;

    h3 {
      margin-top: 0;
      color: #fff;
    }

    ul,
    ol {
      margin: 1rem 0 0;
      padding-left: 1.25rem;
    }

    li {
      margin-bottom: 0.75rem;
      color: rgba(255, 255, 255, 0.82);
    }

    p {
      color: rgba(255, 255, 255, 0.75);
    }
  }
`;

export const NutritionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const NutritionItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 0.85rem 0.95rem;

  strong {
    display: block;
    margin-bottom: 0.45rem;
  }
`;
