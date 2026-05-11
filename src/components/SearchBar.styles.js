import styled from 'styled-components';

export const SearchContainer = styled.form`
  display: flex;
  max-width: 720px;
  width: 100%;
  margin: 0 auto 1.5rem;
  gap: 0.75rem;
  flex-direction: column;
`;

export const SearchInputWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
`;

export const SearchInput = styled.input`
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  padding: 0.9rem 1.25rem;
  background: rgba(255, 255, 255, 0.1);
  color: #f4f4f4;
  outline: none;
  font-size: 1rem;
  transition: all 0.2s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.65);
  }

  &:focus {
    border-color: #ff6d24;
    background: rgba(255, 255, 255, 0.15);
  }
`;

export const SearchButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1.5rem;
  background: #ff6d24;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: #ff7d3e;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export const ErrorMessage = styled.p`
  color: #ff7f7f;
  font-size: 0.9rem;
  margin: 0.5rem 0;
  padding: 0.75rem 1rem;
  background: rgba(255, 127, 127, 0.1);
  border-left: 3px solid #ff7f7f;
  border-radius: 4px;
`;
