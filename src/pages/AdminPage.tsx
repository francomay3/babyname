import { useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconExternalLink,
  IconTrash,
  IconUserOff,
  IconUserPlus,
  IconUserX,
} from '@tabler/icons-react';
import { useAdmin } from '../hooks/useAdmin';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../hooks/useAuth';

type ConfirmAction = { action: 'resetVotes' | 'deleteUser'; uid: string; name: string };

export function AdminPage({ onNavigateToUser }: { onNavigateToUser: (uid: string) => void }) {
  const { t } = useLocale();
  const { user } = useAuth();
  const { adminUids, allUsersWithStats, resetUserVotes, deleteUser, resetDatabase, addAdmin, removeAdmin } =
    useAdmin();

  const [confirmModal, setConfirmModal] = useState<ConfirmAction | null>(null);
  const [resetDbModal, setResetDbModal] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  async function handleConfirm() {
    if (!confirmModal) return;
    setLoading(true);
    try {
      if (confirmModal.action === 'resetVotes') {
        await resetUserVotes(confirmModal.uid);
        notifications.show({ color: 'green', message: t.adminDeleteVotesSuccess });
      } else {
        await deleteUser(confirmModal.uid);
        notifications.show({ color: 'green', message: t.adminDeleteUserSuccess });
      }
      setConfirmModal(null);
    } catch {
      notifications.show({ color: 'red', message: t.adminErrorMsg });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetDb() {
    if (resetInput !== t.adminResetConfirmWord) return;
    setLoading(true);
    try {
      await resetDatabase();
      notifications.show({ color: 'green', message: t.adminResetSuccess });
      setResetDbModal(false);
      setResetInput('');
    } catch {
      notifications.show({ color: 'red', message: t.adminErrorMsg });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin() {
    if (!selectedUid) return;
    try {
      await addAdmin(selectedUid);
      setSelectedUid(null);
    } catch {
      notifications.show({ color: 'red', message: t.adminErrorMsg });
    }
  }

  const nonAdminUsers = allUsersWithStats.filter((u) => !adminUids.includes(u.uid));

  const nonAdminUserOptions = nonAdminUsers.map((u) => ({ value: u.uid, label: u.displayName }));

  return (
    <>
      <Accordion defaultValue="users" variant="separated">
        {/* ── Section 1: Users ─────────────────────────────────────────────── */}
        <Accordion.Item value="users">
          <Accordion.Control>
            <Text fw={500}>{t.adminSectionUsers}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm">
              {nonAdminUsers.map((u) => (
                <Card key={u.uid} shadow="xs" radius="md" withBorder py="xs" px="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <Avatar src={u.photoURL || undefined} size="sm" radius="xl">
                        {u.displayName?.[0]}
                      </Avatar>
                      <div>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {u.displayName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t.adminNamesCount(u.namesAdded.length)} · {t.adminVotesCount(u.matchCount)}
                        </Text>
                      </div>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        size="sm"
                        title={t.adminViewProfile}
                        onClick={() => onNavigateToUser(u.uid)}
                      >
                        <IconExternalLink size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="orange"
                        size="sm"
                        title={t.adminDeleteVotes}
                        onClick={() =>
                          setConfirmModal({ action: 'resetVotes', uid: u.uid, name: u.displayName })
                        }
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="sm"
                        title={t.adminDeleteUser}
                        disabled={u.uid === user?.uid}
                        onClick={() =>
                          setConfirmModal({ action: 'deleteUser', uid: u.uid, name: u.displayName })
                        }
                      >
                        <IconUserOff size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* ── Section 2: Admins ────────────────────────────────────────────── */}
        <Accordion.Item value="admins">
          <Accordion.Control>
            <Text fw={500}>{t.adminSectionAdmins}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm">
              {adminUids.map((uid) => {
                const info = allUsersWithStats.find((u) => u.uid === uid);
                return (
                  <Group key={uid} justify="space-between" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                      <Avatar src={info?.photoURL || undefined} size="xs" radius="xl">
                        {info?.displayName?.[0]}
                      </Avatar>
                      <Text size="sm">{info?.displayName ?? uid}</Text>
                      {uid === user?.uid && (
                        <Badge size="xs" variant="light" color="blue">
                          {t.adminYouLabel}
                        </Badge>
                      )}
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      title={t.adminRemoveAdmin}
                      disabled={uid === user?.uid}
                      onClick={() => removeAdmin(uid)}
                    >
                      <IconUserX size={14} />
                    </ActionIcon>
                  </Group>
                );
              })}

              {nonAdminUserOptions.length > 0 && (
                <Group mt="xs" wrap="nowrap">
                  <Select
                    style={{ flex: 1 }}
                    size="xs"
                    placeholder={t.adminAddAdmin}
                    data={nonAdminUserOptions}
                    value={selectedUid}
                    onChange={setSelectedUid}
                    clearable
                  />
                  <ActionIcon
                    variant="light"
                    color="blue"
                    disabled={!selectedUid}
                    onClick={handleAddAdmin}
                  >
                    <IconUserPlus size={14} />
                  </ActionIcon>
                </Group>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* ── Section 3: Danger Zone ───────────────────────────────────────── */}
        <Accordion.Item value="danger">
          <Accordion.Control
            icon={<IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />}
          >
            <Text fw={500} c="red">
              {t.adminSectionDanger}
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Button
              color="red"
              variant="light"
              leftSection={<IconAlertTriangle size={16} />}
              onClick={() => {
                setResetInput('');
                setResetDbModal(true);
              }}
            >
              {t.adminResetDb}
            </Button>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* ── Confirm modal (reset votes / delete user) ────────────────────────── */}
      <Modal
        opened={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={t.adminConfirmTitle}
        size="sm"
        centered
      >
        <Text size="sm" mb="lg">
          {confirmModal?.action === 'resetVotes'
            ? `${t.adminDeleteVotes}: ${confirmModal?.name}`
            : `${t.adminDeleteUser}: ${confirmModal?.name}`}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" size="sm" onClick={() => setConfirmModal(null)}>
            {t.adminCancel}
          </Button>
          <Button
            color={confirmModal?.action === 'resetVotes' ? 'orange' : 'red'}
            size="sm"
            loading={loading}
            onClick={handleConfirm}
          >
            {t.adminConfirm}
          </Button>
        </Group>
      </Modal>

      {/* ── Reset database modal ─────────────────────────────────────────────── */}
      <Modal
        opened={resetDbModal}
        onClose={() => setResetDbModal(false)}
        title={t.adminResetDb}
        size="sm"
        centered
      >
        <Text size="sm" c="red" mb="sm">
          {t.adminResetConfirmPrompt}
        </Text>
        <TextInput
          value={resetInput}
          onChange={(e) => setResetInput(e.currentTarget.value)}
          placeholder={t.adminResetConfirmWord}
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="default" size="sm" onClick={() => setResetDbModal(false)}>
            {t.adminCancel}
          </Button>
          <Button
            color="red"
            size="sm"
            loading={loading}
            disabled={resetInput !== t.adminResetConfirmWord}
            onClick={handleResetDb}
          >
            {t.adminResetDb}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
