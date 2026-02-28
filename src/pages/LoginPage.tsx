import { Button, Center, Stack, Text, Title, Paper } from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../context/LocaleContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const { t } = useLocale();

  return (
    <Center h="100vh" bg="pink.0">
      <Paper shadow="xl" radius="xl" p="xl" w={360} withBorder>
        <Stack align="center" gap="lg">
          <Text fz={56} style={{ lineHeight: 1 }}>
            👶
          </Text>
          <Title order={1} ta="center" c="pink.6">
            BabyName
          </Title>
          <Text c="dimmed" ta="center" fz="sm">
            {t.loginSubtitle}
          </Text>
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
        </Stack>
      </Paper>
    </Center>
  );
}
