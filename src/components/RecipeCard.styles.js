import styled from 'styled-components';

export const CardContainer = styled.article`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.18);
  }
`;

export const CardImage = styled.div`
  min-height: 180px;
  background-size: cover;
  background-position: center;
  background-image: ${(props) => (props.src ? `url(${props.src})` : 'none')};
  position: relative;
`;

export const CardPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.05);
`;

export const CardContent = styled.div`
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;

  h3 {
    margin: 0 0 0.75rem;
    font-size: 1.15rem;
    line-height: 1.3;
  }

  p {
    margin: 0 0 1rem;
    color: rgba(255, 255, 255, 0.75);
    flex: 1;
    font-size: 0.95rem;
  }
`;

export const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.7);
  gap: 0.5rem;
`;
