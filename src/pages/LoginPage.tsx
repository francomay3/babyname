import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Anchor,
  Button,
  Center,
  Divider,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../context/LocaleContext';

export function LoginPage() {
  const { signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const { t } = useLocale();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, name.trim() || email.split('@')[0]);
      }
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError(t.loginErrorInvalidCredential);
      } else if (code === 'auth/email-already-in-use') {
        setError(t.loginErrorEmailInUse);
      } else if (code === 'auth/weak-password') {
        setError(t.loginErrorWeakPassword);
      } else {
        setError(t.loginErrorGeneric);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
  }

  return (
    <Center h="100vh" bg="pink.0">
      <Paper shadow="xl" radius="xl" p="xl" w={360} withBorder>
        <Stack gap="lg">
          <Stack align="center" gap="xs">
            <Text fz={56} style={{ lineHeight: 1 }}>
              🍞
            </Text>
            <Title order={1} ta="center" c="pink.6">
              BabyName
            </Title>
            <Text c="dimmed" ta="center" fz="sm">
              {t.loginSubtitle}
            </Text>
          </Stack>

          <Button
            leftSection={<IconBrandGoogle size={18} />}
            variant="filled"
            color="pink"
            size="md"
            radius="xl"
            fullWidth
            onClick={signIn}
          >
            {t.loginButton}
          </Button>

          <Divider label={t.loginOrDivider} labelPosition="center" />

          <form onSubmit={handleEmailSubmit}>
            <Stack gap="sm">
              {mode === 'signup' && (
                <TextInput
                  placeholder={t.loginNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  radius="xl"
                  required
                />
              )}
              <TextInput
                type="email"
                placeholder={t.loginEmailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                radius="xl"
                required
              />
              <PasswordInput
                placeholder={t.loginPasswordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                radius="xl"
                required
              />
              {error && (
                <Text fz="xs" c="red" ta="center">
                  {error}
                </Text>
              )}
              <Button
                type="submit"
                variant="outline"
                color="pink"
                radius="xl"
                fullWidth
                loading={submitting}
              >
                {mode === 'signin' ? t.loginSignInButton : t.loginCreateAccountButton}
              </Button>
            </Stack>
          </form>

          <Text ta="center" fz="xs" c="dimmed">
            <Anchor component="button" fz="xs" onClick={switchMode}>
              {mode === 'signin' ? t.loginRegisterLink : t.loginSignInLink}
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
