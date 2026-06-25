import styled from 'styled-components';

export const ResourcePanel = styled.section`
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const ResourceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
  margin-bottom: 1rem;

  h2 {
    margin: 0 0 0.4rem;
    font-size: 1.35rem;
  }

  p {
    margin: 0;
    color: rgba(248, 250, 252, 0.72);
    line-height: 1.6;
  }
`;

export const ResourceForm = styled.form`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  margin-bottom: 1.3rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

export const ResourceField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-size: 0.95rem;
    color: rgba(248, 250, 252, 0.82);
  }
`;

export const ResourceInput = styled.input`
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  padding: 0.8rem 0.95rem;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;

  &:focus {
    outline: 2px solid rgba(255, 109, 36, 0.45);
    outline-offset: 1px;
  }
`;

export const ResourceTextarea = styled.textarea`
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  padding: 0.8rem 0.95rem;
  min-height: 96px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  resize: vertical;

  &:focus {
    outline: 2px solid rgba(255, 109, 36, 0.45);
    outline-offset: 1px;
  }
`;

export const ResourceButton = styled.button`
  align-self: end;
  border: none;
  border-radius: 999px;
  padding: 0.8rem 1rem;
  cursor: pointer;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #ff6d24 0%, #ff8a3d 100%);
  min-height: 46px;

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`;

export const ResourceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.9rem;
`;

export const ResourceItem = styled.li`
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

export const ResourceMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
`;

export const ResourceActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const ActionButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  cursor: pointer;
`;

export const Notice = styled.p`
  margin: 0 0 1rem;
  padding: 0.8rem 0.95rem;
  border-radius: 12px;
  background: ${(props) => (props.$variant === 'error' ? 'rgba(255, 127, 127, 0.16)' : 'rgba(74, 222, 128, 0.16)')};
  color: ${(props) => (props.$variant === 'error' ? '#ffb3b3' : '#bbf7d0')};
`;
