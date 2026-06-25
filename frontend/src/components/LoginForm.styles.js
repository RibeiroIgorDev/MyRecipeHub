import styled from 'styled-components';

export const AuthPage = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
  color: #f8fafc;
`;

export const AuthCard = styled.div`
  width: min(100%, 420px);
  padding: 2rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 109, 36, 0.15);
  color: #ffb07f;
  font-weight: 700;
  margin-bottom: 1rem;
`;

export const Title = styled.h2`
  margin: 0 0 0.5rem;
  font-size: 1.7rem;
`;

export const Subtitle = styled.p`
  margin: 0 0 1.5rem;
  color: rgba(248, 250, 252, 0.74);
  line-height: 1.6;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  label {
    font-size: 0.95rem;
    color: rgba(248, 250, 252, 0.86);
  }
`;

export const Input = styled.input`
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1rem;

  &:focus {
    outline: 2px solid rgba(255, 109, 36, 0.45);
    outline-offset: 1px;
  }
`;

export const Button = styled.button`
  margin-top: 0.25rem;
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1rem;
  background: linear-gradient(135deg, #ff6d24 0%, #ff8a3d 100%);
  color: #fff;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
`;

export const ErrorMessage = styled.p`
  margin: 0.75rem 0 0;
  color: #ffb3b3;
  font-size: 0.95rem;
`;
