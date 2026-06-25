import { useState } from 'react';
import {
  AuthPage,
  AuthCard,
  Badge,
  Title,
  Subtitle,
  Form,
  Field,
  Input,
  Button,
  ErrorMessage,
} from './LoginForm.styles';

export default function LoginForm({ onLogin, loading, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin(username, password);
  };

  return (
    <AuthPage>
      <AuthCard>
        <Badge>MyRecipeHub</Badge>
        <Title>Autenticação</Title>
        <Subtitle>Entre para acessar a busca e as operações protegidas do projeto.</Subtitle>
        <Form onSubmit={handleSubmit}>
          <Field>
            <label htmlFor="username">Usuário</label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
            />
          </Field>
          <Field>
            <label htmlFor="password">Senha</label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="admin123"
            />
          </Field>
          <Button type="submit" disabled={loading || !username.trim() || !password.trim()}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </Form>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </AuthCard>
    </AuthPage>
  );
}
