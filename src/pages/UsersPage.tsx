import { Avatar, Group, Paper, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../context/LocaleContext';
import { useUserStatsSummary } from '../hooks/useUserStatsSummary';

export function UsersPage({ onNavigateToUser }: { onNavigateToUser: (uid: string) => void }) {
  const { allUsers, user } = useAuth();
  const { t } = useLocale();
  const { statsByUserId } = useUserStatsSummary();

  return (
    <Stack gap="sm">
      <Title order={4}>{t.usersTitle}</Title>
      {allUsers.map((u) => {
        const stats = statsByUserId[u.uid];
        const namesCount = stats?.namesCount ?? 0;
        const votesCount = stats?.votesCount ?? 0;

        return (
          <UnstyledButton key={u.uid} onClick={() => onNavigateToUser(u.uid)} style={{ display: 'block' }}>
            <Paper shadow="xs" radius="md" withBorder py="xs" px="sm">
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <Avatar src={u.photoURL || undefined} size="md" radius="xl">
                    {u.displayName?.[0]}
                  </Avatar>
                  <div>
                    <Text fw={500}>
                      {u.displayName}
                      {u.uid === user?.uid && (
                        <Text span fz="xs" c="dimmed" ml={6}>
                          (tú)
                        </Text>
                      )}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t.adminNamesCount(namesCount)} · {t.adminVotesCount(votesCount)}
                    </Text>
                  </div>
                </Group>
                <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />
              </Group>
            </Paper>
          </UnstyledButton>
        );
      })}
    </Stack>
  );
}
