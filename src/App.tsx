import { useState, useRef } from 'react';
import type { CSSProperties } from 'react';
import {
  AppShell,
  Tabs,
  Group,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
  Container,
  Loader,
  Center,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { IconLogout, IconChevronDown } from '@tabler/icons-react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { AddNamesPage } from './pages/AddNamesPage';
import { VotePage } from './pages/VotePage';
import { RankingPage } from './pages/RankingPage';

type Tab = 'add' | 'vote' | 'ranking';

const TAB_ORDER: Record<Tab, number> = { add: 0, vote: 1, ranking: 2 };

export default function App() {
  const { user, loading, logOut } = useAuth();

  const [tab, setTab] = useLocalStorage<Tab>({ key: 'babyname-tab', defaultValue: 'vote' });
  // displayTab lags behind tab during the transition so content swaps mid-flight.
  // Must read localStorage directly — useState(tab) would capture Mantine's defaultValue
  // since useLocalStorage updates tab in a useEffect, after the first render.
  const [displayTab, setDisplayTab] = useState<Tab>(() => {
    try {
      const stored = localStorage.getItem('babyname-tab');
      if (stored) {
        const parsed = JSON.parse(stored) as Tab;
        if (['add', 'vote', 'ranking'].includes(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return 'vote';
  });
  const [contentStyle, setContentStyle] = useState<CSSProperties>({});
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTabChange(newTab: Tab) {
    if (newTab === displayTab) return;
    const dir = TAB_ORDER[newTab] > TAB_ORDER[displayTab] ? 1 : -1;
    setTab(newTab);

    if (transitionRef.current) clearTimeout(transitionRef.current);

    // Exit: slide out opposite to travel direction
    setContentStyle({
      opacity: 0,
      transform: `translateX(${dir * -24}px)`,
      transition: 'opacity 0.15s ease, transform 0.15s ease',
      pointerEvents: 'none',
    });

    transitionRef.current = setTimeout(() => {
      setDisplayTab(newTab);
      // Reset to enter position with no transition (browser won't animate the jump)
      setContentStyle({
        opacity: 0,
        transform: `translateX(${dir * 24}px)`,
        transition: 'none',
      });
      // Two rAF frames ensure the browser commits the reset before animating in
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setContentStyle({
            opacity: 1,
            transform: 'translateX(0)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          })
        )
      );
    }, 150);
  }

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
              <UnstyledButton>
                <Group gap={4} align="center" wrap="nowrap">
                  <Avatar src={user.photoURL} size="sm" radius="xl" alt={user.displayName ?? ''}>
                    {user.displayName?.[0]}
                  </Avatar>
                  <IconChevronDown size={14} color="gray" />
                </Group>
              </UnstyledButton>
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
          {/* tab indicator moves immediately; content follows with transition */}
          <Tabs value={tab} onChange={(v) => handleTabChange(v as Tab)} mb="xl" color="pink">
            <Tabs.List grow>
              <Tabs.Tab value="add">✨ Nombres</Tabs.Tab>
              <Tabs.Tab value="vote">⚔️ Votar</Tabs.Tab>
              <Tabs.Tab value="ranking">🏆 Ranking</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <div style={contentStyle}>
            {displayTab === 'add' && <AddNamesPage />}
            {displayTab === 'vote' && <VotePage onGoToNames={() => handleTabChange('add')} />}
            {displayTab === 'ranking' && <RankingPage />}
          </div>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
