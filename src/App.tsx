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
  ActionIcon,
  Loader,
  Center,
  Drawer,
  Box,
  Flex,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { IconLogout, IconChevronDown, IconSettings } from '@tabler/icons-react';
import { useAuth } from './hooks/useAuth';
import { useLocale } from './context/LocaleContext';
import { useAdmin } from './hooks/useAdmin';
import { LoginPage } from './pages/LoginPage';
import { AddNamesPage } from './pages/AddNamesPage';
import { VotePage } from './pages/VotePage';
import { RankingPage } from './pages/RankingPage';
import { AdminPage } from './pages/AdminPage';

type Tab = 'add' | 'vote' | 'ranking';

const TAB_ORDER: Record<Tab, number> = { add: 0, vote: 1, ranking: 2 };

export default function App() {
  const { user, loading, logOut } = useAuth();
  const { t, toggleLocale } = useLocale();
  const { isAdmin } = useAdmin();
  const [adminOpen, setAdminOpen] = useState(false);

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

    setContentStyle({
      opacity: 0,
      transform: `translateX(${dir * -24}px)`,
      transition: 'opacity 0.15s ease, transform 0.15s ease',
      pointerEvents: 'none',
    });

    transitionRef.current = setTimeout(() => {
      setDisplayTab(newTab);
      setContentStyle({
        opacity: 0,
        transform: `translateX(${dir * 24}px)`,
        transition: 'none',
      });
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
    <>
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header px={{ base: 'xs', sm: 'md' }}>
        <Group h="100%" justify="space-between">
          <UnstyledButton onClick={() => handleTabChange('add')}>
            <Text fw={700} fz="lg" c="pink.6" visibleFrom="sm">{t.appTitle}</Text>
            <Text fw={700} fz="xl" c="pink.6" hiddenFrom="sm">👶</Text>
          </UnstyledButton>
          <Group gap="xs" align="center">
            {isAdmin && (
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setAdminOpen(true)}>
                <IconSettings size={18} />
              </ActionIcon>
            )}
            <UnstyledButton onClick={toggleLocale}>
              <Text fz="sm" c="gray.7" visibleFrom="sm">{t.langToggleLabel}</Text>
              <Text style={{ fontSize: 20, lineHeight: 1 }} hiddenFrom="sm">{t.langToggleLabelMobile}</Text>
            </UnstyledButton>
            <Menu shadow="md" radius="lg" position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={4} align="center" wrap="nowrap">
                    <Avatar
                      src={user.photoURL}
                      size="sm"
                      radius="xl"
                      alt={user.displayName ?? ''}
                    >
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
                  {t.logout}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Flex justify="center">

        <Box maw="700" w="100%">
          <Tabs
            value={tab}
            onChange={(v) => handleTabChange(v as Tab)}
            color="pink"
            mb="xl"
            styles={{ tab: { paddingLeft: 8, paddingRight: 8 } }}
          >
            <Tabs.List grow style={{ flexWrap: 'nowrap' }}>
              <Tabs.Tab value="add" style={{ whiteSpace: 'nowrap' }}>{t.tabNames}</Tabs.Tab>
              <Tabs.Tab value="vote" style={{ whiteSpace: 'nowrap' }}>{t.tabVote}</Tabs.Tab>
              <Tabs.Tab value="ranking" style={{ whiteSpace: 'nowrap' }}>{t.tabRanking}</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <div style={contentStyle}>
            {displayTab === 'add' && <AddNamesPage />}
            {displayTab === 'vote' && <VotePage onGoToNames={() => handleTabChange('add')} />}
            {displayTab === 'ranking' && <RankingPage />}
          </div>
        </Box>
        </Flex>
      </AppShell.Main>
    </AppShell>

    <Drawer
      opened={adminOpen}
      onClose={() => setAdminOpen(false)}
      title={t.adminDrawerTitle}
      position="right"
      size="lg"
    >
      <AdminPage />
    </Drawer>
    </>
  );
}
