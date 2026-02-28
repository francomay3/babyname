import { useState } from 'react';
import {
  AppShell,
  Tabs,
  Group,
  Text,
  Avatar,
  Menu,
  ActionIcon,
  Container,
  Loader,
  Center,
} from '@mantine/core';
import { IconLogout, IconChevronDown } from '@tabler/icons-react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { AddNamesPage } from './pages/AddNamesPage';
import { VotePage } from './pages/VotePage';
import { RankingPage } from './pages/RankingPage';

type Tab = 'add' | 'vote' | 'ranking';

export default function App() {
  const { user, loading, logOut } = useAuth();
  const [tab, setTab] = useState<Tab>('vote');

  if (loading) {
    return (
      <Center h="100vh">
        <Loader color="pink" size="lg" />
      </Center>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between">
          <Text fw={700} fz="lg" c="pink.6">
            👶 BabyName
          </Text>
          <Menu shadow="md" radius="lg" position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                <Group gap={6}>
                  <Avatar
                    src={user.photoURL}
                    size="sm"
                    radius="xl"
                    alt={user.displayName ?? ''}
                  >
                    {user.displayName?.[0]}
                  </Avatar>
                  <IconChevronDown size={14} />
                </Group>
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user.displayName}</Menu.Label>
              <Menu.Item
                leftSection={<IconLogout size={14} />}
                color="red"
                onClick={logOut}
              >
                Cerrar sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="sm" pb="xl">
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            mb="xl"
            color="pink"
          >
            <Tabs.List grow>
              <Tabs.Tab value="add">✨ Nombres</Tabs.Tab>
              <Tabs.Tab value="vote">⚔️ Votar</Tabs.Tab>
              <Tabs.Tab value="ranking">🏆 Ranking</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {tab === 'add' && <AddNamesPage />}
          {tab === 'vote' && <VotePage onGoToNames={() => setTab('add')} />}
          {tab === 'ranking' && <RankingPage />}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
