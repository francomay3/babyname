import { Button, Center, Stack, Text, Title, Paper } from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signIn } = useAuth();

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
            Elegí el nombre perfecto para tu bebé jugando a duelos entre nombres.
            ¡El ganador se gana el corazón de la familia!
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
            Entrar con Google
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
