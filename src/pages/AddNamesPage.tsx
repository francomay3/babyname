import { useState } from 'react';
import {
  Stack,
  TextInput,
  Button,
  SegmentedControl,
  Group,
  Text,
  Badge,
  SimpleGrid,
  Paper,
  Title,
  Divider,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNames } from '../hooks/useNames';
import type { Gender } from '../types';

export function AddNamesPage() {
  const [text, setText] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const { names: femaleNames } = useNames('female');
  const { names: maleNames, addName } = useNames('male');

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const all = [...femaleNames, ...maleNames];
    const duplicate = all.find(
      (n) => n.text.toLowerCase() === trimmed.toLowerCase() && n.gender === gender
    );
    if (duplicate) {
      notifications.show({
        color: 'orange',
        title: '¡Ya existe!',
        message: `"${trimmed}" ya está en la lista de ${gender === 'female' ? 'nenas' : 'nenes'}.`,
      });
      return;
    }

    await addName(trimmed, gender);
    setText('');
    notifications.show({
      color: 'pink',
      title: '¡Nombre agregado!',
      message: `"${trimmed}" entró al ruedo 🎉`,
    });
  }

  const genderColor = gender === 'female' ? 'pink' : 'blue';

  return (
    <Stack gap="xl">
      <Paper shadow="sm" radius="lg" p="lg" withBorder>
        <Stack gap="md">
          <Title order={3} c={`${genderColor}.6`}>
            ✨ Sugerí un nombre
          </Title>
          <SegmentedControl
            value={gender}
            onChange={(v) => setGender(v as Gender)}
            data={[
              { label: '👧 Nena', value: 'female' },
              { label: '👦 Nene', value: 'male' },
            ]}
            color={genderColor}
            radius="xl"
          />
          <Group>
            <TextInput
              placeholder="Escribe un nombre..."
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              radius="xl"
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleSubmit}
              color={genderColor}
              radius="xl"
            >
              Agregar
            </Button>
          </Group>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
        <NameList title="👧 Nenas" names={femaleNames.map((n) => n.text)} color="pink" />
        <NameList title="👦 Nenes" names={maleNames.map((n) => n.text)} color="blue" />
      </SimpleGrid>
    </Stack>
  );
}

function NameList({
  title,
  names,
  color,
}: {
  title: string;
  names: string[];
  color: string;
}) {
  return (
    <Paper shadow="sm" radius="lg" p="lg" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>{title}</Title>
          <Badge color={color} variant="light" radius="xl">
            {names.length} nombres
          </Badge>
        </Group>
        <Divider />
        {names.length === 0 ? (
          <Text c="dimmed" fz="sm" ta="center" py="md">
            Todavía no hay nombres. ¡Sé el primero!
          </Text>
        ) : (
          <Stack gap={4}>
            {names.map((name) => (
              <Text key={name} fz="sm" px="xs" py={4}>
                {name}
              </Text>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
