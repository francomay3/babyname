import { useState, useRef, useEffect } from 'react';
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
  Modal,
  Stack,
  Badge,
} from '@mantine/core';
import { useLocalStorage, useMediaQuery } from '@mantine/hooks';
import { IconLogout, IconChevronDown, IconSettings, IconUser, IconInfoCircle } from '@tabler/icons-react';
import { useAuth } from './hooks/useAuth';
import { useLocale } from './context/LocaleContext';
import { useAdmin } from './hooks/useAdmin';
import { LoginPage } from './pages/LoginPage';
import { AddNamesPage } from './pages/AddNamesPage';
import { VotePage } from './pages/VotePage';
import { RankingPage } from './pages/RankingPage';
import { UsersPage } from './pages/UsersPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { AdminPage } from './pages/AdminPage';

type Tab = 'add' | 'vote' | 'ranking' | 'users';

const TAB_ORDER: Record<Tab, number> = { add: 0, vote: 1, ranking: 2, users: 3 };

export default function App() {
  const { user, loading, logOut } = useAuth();
  const { t, toggleLocale } = useLocale();
  const { isAdmin } = useAdmin();
  const [adminOpen, setAdminOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const isVerySmall = useMediaQuery('(max-width: 380px)');

  function tabLabel(label: string) {
    if (!isVerySmall) return label;
    const spaceIdx = label.indexOf(' ');
    const emoji = label.slice(0, spaceIdx);
    const text = label.slice(spaceIdx + 1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, lineHeight: 1.2 }}>
        <span>{emoji}</span>
        <span style={{ fontSize: '0.85em' }}>{text}</span>
      </div>
    );
  }

  const [tab, setTab] = useLocalStorage<Tab>({ key: 'babyname-tab', defaultValue: 'vote' });
  // displayTab lags behind tab during the transition so content swaps mid-flight.
  // Must read localStorage directly — useState(tab) would capture Mantine's defaultValue
  // since useLocalStorage updates tab in a useEffect, after the first render.
  const [displayTab, setDisplayTab] = useState<Tab>(() => {
    try {
      const stored = localStorage.getItem('babyname-tab');
      if (stored) {
        const parsed = JSON.parse(stored) as Tab;
        if (['add', 'vote', 'ranking', 'users'].includes(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return 'vote';
  });

  const [profileUserId, setProfileUserId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('babyname-profile-uid');
      if (stored) return JSON.parse(stored) as string;
    } catch { /* ignore */ }
    return null;
  });
  useEffect(() => {
    if (profileUserId) {
      localStorage.setItem('babyname-profile-uid', JSON.stringify(profileUserId));
    } else {
      localStorage.removeItem('babyname-profile-uid');
    }
  }, [profileUserId]);
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
      <AppShell.Header px={{ base: 'xs', xs: 'md' }}>
        <Group h="100%" justify="space-between">
          <UnstyledButton onClick={() => { setProfileUserId(null); handleTabChange('vote'); }}>
            <Text fw={700} fz="lg" c="pink.6" visibleFrom="xs">{t.appTitle}</Text>
            <Text fw={700} fz="xl" c="pink.6" hiddenFrom="xs">👶</Text>
          </UnstyledButton>
          <Group gap="xs" align="center">
            <ActionIcon variant="subtle" color="pink" size="sm" onClick={() => setInfoOpen(true)}>
              <IconInfoCircle size={18} />
            </ActionIcon>
            {isAdmin && (
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setAdminOpen(true)}>
                <IconSettings size={18} />
              </ActionIcon>
            )}
            <UnstyledButton onClick={toggleLocale}>
              <Text fz="sm" c="gray.7" visibleFrom="xs">{t.langToggleLabel}</Text>
              <Text style={{ fontSize: 20, lineHeight: 1 }} hiddenFrom="xs">{t.langToggleLabelMobile}</Text>
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
                  leftSection={<IconUser size={14} />}
                  onClick={() => setProfileUserId(user.uid)}
                >
                  {t.profileViewProfile}
                </Menu.Item>
                <Menu.Divider />
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
          {profileUserId ? (
            <UserProfilePage
              userId={profileUserId}
              onBack={() => setProfileUserId(null)}
            />
          ) : (
            <>
              <Tabs
                value={tab}
                onChange={(v) => handleTabChange(v as Tab)}
                color="pink"
                mb="xl"
                styles={{ tab: { paddingLeft: 8, paddingRight: 8 } }}
              >
                <Tabs.List grow style={{ flexWrap: 'nowrap' }}>
                  <Tabs.Tab value="add" style={{ whiteSpace: 'nowrap' }}>{tabLabel(t.tabNames)}</Tabs.Tab>
                  <Tabs.Tab value="vote" style={{ whiteSpace: 'nowrap' }}>{tabLabel(t.tabVote)}</Tabs.Tab>
                  <Tabs.Tab value="ranking" style={{ whiteSpace: 'nowrap' }}>{tabLabel(t.tabRanking)}</Tabs.Tab>
                  <Tabs.Tab value="users" style={{ whiteSpace: 'nowrap' }}>{tabLabel(t.tabUsers)}</Tabs.Tab>
                </Tabs.List>
              </Tabs>

              <div style={contentStyle}>
                {displayTab === 'add' && <AddNamesPage onNavigateToUser={setProfileUserId} />}
                {displayTab === 'vote' && <VotePage onGoToNames={() => handleTabChange('add')} />}
                {displayTab === 'ranking' && <RankingPage onNavigateToUser={setProfileUserId} />}
                {displayTab === 'users' && <UsersPage onNavigateToUser={setProfileUserId} />}
              </div>
            </>
          )}
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
      <AdminPage onNavigateToUser={(uid) => { setAdminOpen(false); setProfileUserId(uid); }} />
    </Drawer>

    <Modal
      opened={infoOpen}
      onClose={() => setInfoOpen(false)}
      title={<Text fw={700} fz="lg" c="pink.6">{t.infoTitle}</Text>}
      centered
      size="md"
    >
      <Stack gap="md">
        <Text fz="sm">{t.infoPurpose}</Text>
        <Text fz="sm">{t.infoNotBinding}</Text>
        <Text fz="sm">{t.infoLucia}</Text>
        <Text fz="sm">{t.infoGender}</Text>
        <Badge color="pink" variant="light" radius="xl" size="lg" mt="xs">
          {t.infoDueDate}
        </Badge>
      </Stack>
    </Modal>
    </>
  );
}
