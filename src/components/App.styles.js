import styled from 'styled-components';

export const AppContainer = styled.div`
  width: 100%;
  min-height: 100vh;
`;

export const Shell = styled.main`
  max-width: 1240px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
`;

export const HeroPanel = styled.section`
  padding: 2rem 1.25rem;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 2rem;

  > div {
    margin-bottom: 1.5rem;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.4rem, 4vw, 3.6rem);
    line-height: 1.05;
  }

  p {
    margin: 1rem 0 0;
    max-width: 760px;
    color: rgba(248, 250, 252, 0.78);
    font-size: 1.05rem;
    line-height: 1.8;
  }
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  background: rgba(255, 109, 36, 0.12);
  color: #ffb07f;
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

export const StatusBar = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
  color: rgba(248, 250, 252, 0.82);
  font-size: 0.95rem;

  .error-message {
    color: #ff7f7f;
  }
`;

export const ResultsPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const RecipeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

export const EmptyState = styled.p`
  text-align: center;
  color: rgba(248, 250, 252, 0.7);
  margin: 2rem 0;
`;

export const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;

  button {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    padding: 0.75rem 1.2rem;
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba(255, 109, 36, 0.15);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  span {
    color: rgba(248, 250, 252, 0.78);
  }
`;
