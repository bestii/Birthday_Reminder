import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { DatabaseSync } from 'node:sqlite';

import { ManageGroupsScreen } from '../ManageGroupsScreen';
import { ThemeProvider } from '../../theme/ThemeContext';
import { createNodeSqliteConnection } from '../../db/node-adapter';
import { migrate } from '../../db/migrate';
import { Repository } from '../../db/repository';

function makeRepo(): Repository {
  const db = new DatabaseSync(':memory:');
  const conn = createNodeSqliteConnection(db);
  migrate(conn);
  return new Repository(conn);
}

function wipeGroups(repo: Repository): void {
  for (const g of repo.listGroups()) {
    repo.deleteGroup(g.id);
  }
}

async function renderScreen(repo: Repository) {
  return render(
    <ThemeProvider>
      <PaperProvider>
        <ManageGroupsScreen repository={repo} />
      </PaperProvider>
    </ThemeProvider>,
  );
}

describe('ManageGroupsScreen — empty state', () => {
  it('shows the empty-state prompt when no groups exist', async () => {
    const repo = makeRepo();
    wipeGroups(repo);
    const { findByText } = await renderScreen(repo);
    const prompt = await findByText(/No groups yet\. Tap \+ to create your first group\./);
    expect(prompt).toBeTruthy();
  });

  it('does not show the empty state on first install — the three defaults are seeded', async () => {
    const repo = makeRepo();
    const { queryByText, findByText } = await renderScreen(repo);
    expect(queryByText(/No groups yet\. Tap \+ to create your first group\./)).toBeNull();
    expect(await findByText('Friends')).toBeTruthy();
    expect(await findByText('Family')).toBeTruthy();
    expect(await findByText('Work')).toBeTruthy();
  });
});

describe('ManageGroupsScreen — list', () => {
  it('renders a row per group with name and people count', async () => {
    const repo = makeRepo();
    const family = repo.findGroupByName('Family')!;
    const work = repo.findGroupByName('Work')!;
    const ada = repo.createPerson({ name: 'Ada' });
    const ben = repo.createPerson({ name: 'Ben' });
    repo.assignGroupsToPerson(ada.id, [family.id, work.id]);
    repo.assignGroupsToPerson(ben.id, [family.id]);

    const { findByText, findAllByText } = await renderScreen(repo);
    expect(await findByText('Family')).toBeTruthy();
    expect(await findByText('Work')).toBeTruthy();
    expect(await findByText('2 people')).toBeTruthy();
    expect((await findAllByText('1 person')).length).toBeGreaterThanOrEqual(1);
  });

  it('shows the add-group button', async () => {
    const repo = makeRepo();
    const { getByLabelText } = await renderScreen(repo);
    expect(getByLabelText('Add group')).toBeTruthy();
  });

  it('shows a delete-group button per row', async () => {
    const repo = makeRepo();
    const { findAllByLabelText } = await renderScreen(repo);
    const buttons = await findAllByLabelText(/Delete group/);
    expect(buttons).toHaveLength(3);
  });
});

describe('ManageGroupsScreen — add flow', () => {
  it('opens an add-group dialog when + is pressed', async () => {
    const repo = makeRepo();
    const { getByLabelText, findByText, findByPlaceholderText } = await renderScreen(repo);
    fireEvent.press(getByLabelText('Add group'));
    expect(await findByText('New Group')).toBeTruthy();
    expect(await findByPlaceholderText('Group name')).toBeTruthy();
  });

  it('creates a group from a non-empty name and closes the dialog', async () => {
    const repo = makeRepo();
    const before = repo.listGroups().length;
    const { getByLabelText, findByPlaceholderText, findByText, queryByText } =
      await renderScreen(repo);

    fireEvent.press(getByLabelText('Add group'));
    const input = await findByPlaceholderText('Group name');
    fireEvent.changeText(input, 'Coworkers');
    fireEvent.press(await findByText('Add'));

    await waitFor(() => {
      expect(queryByText('New Group')).toBeNull();
    });
    expect(repo.listGroups()).toHaveLength(before + 1);
    expect(repo.listGroups().map((g) => g.name)).toContain('Coworkers');
  });

  it('does not create a group for an empty or whitespace name', async () => {
    const repo = makeRepo();
    const before = repo.listGroups().length;
    const { getByLabelText, findByPlaceholderText, findByText } = await renderScreen(repo);
    fireEvent.press(getByLabelText('Add group'));
    const input = await findByPlaceholderText('Group name');
    fireEvent.changeText(input, '   ');
    const addButton = await findByText('Add');
    fireEvent.press(addButton);
    expect(repo.listGroups()).toHaveLength(before);
    expect(await findByText('New Group')).toBeTruthy();
  });

  it('does not create a duplicate group with the same (trimmed) name as a seeded default', async () => {
    const repo = makeRepo();
    const before = repo.listGroups().length;
    const { getByLabelText, findByPlaceholderText, findByText } = await renderScreen(repo);
    fireEvent.press(getByLabelText('Add group'));
    const input = await findByPlaceholderText('Group name');
    fireEvent.changeText(input, '  family  ');
    fireEvent.press(await findByText('Add'));
    expect(repo.listGroups()).toHaveLength(before);
  });

  it('cancel dismisses the dialog without creating a group', async () => {
    const repo = makeRepo();
    const before = repo.listGroups().length;
    const { getByLabelText, findByText } = await renderScreen(repo);
    fireEvent.press(getByLabelText('Add group'));
    fireEvent.press(await findByText('Cancel'));
    expect(repo.listGroups()).toHaveLength(before);
  });

  it('shows a validation error when the name is empty', async () => {
    const repo = makeRepo();
    const { getByLabelText, findByText, findByPlaceholderText } = await renderScreen(repo);
    fireEvent.press(getByLabelText('Add group'));
    await findByPlaceholderText('Group name');
    fireEvent.press(await findByText('Add'));
    expect(await findByText(/name is required/i)).toBeTruthy();
  });

  it('newly added group appears in the list', async () => {
    const repo = makeRepo();
    const { getByLabelText, findByPlaceholderText, findByText } = await renderScreen(repo);
    fireEvent.press(getByLabelText('Add group'));
    const input = await findByPlaceholderText('Group name');
    fireEvent.changeText(input, 'Coworkers');
    fireEvent.press(await findByText('Add'));
    expect(await findByText('Coworkers')).toBeTruthy();
  });
});

describe('ManageGroupsScreen — delete flow', () => {
  it('opens a confirmation dialog when trash is pressed', async () => {
    const repo = makeRepo();
    const { findAllByLabelText, findByText } = await renderScreen(repo);
    const familyDelete = (await findAllByLabelText(/Delete group/)).find((b) =>
      b.props.accessibilityLabel?.includes('Family'),
    )!;
    fireEvent.press(familyDelete);
    expect(await findByText(/Delete "Family"\?/)).toBeTruthy();
  });

  it('deletes a seeded default on confirm and removes it from the list', async () => {
    const repo = makeRepo();
    const before = repo.listGroups().length;
    const { findAllByLabelText, findByText, queryByText } = await renderScreen(repo);
    const familyDelete = (await findAllByLabelText(/Delete group/)).find((b) =>
      b.props.accessibilityLabel?.includes('Family'),
    )!;
    fireEvent.press(familyDelete);
    fireEvent.press(await findByText('Delete'));
    await waitFor(() => {
      expect(queryByText('Family')).toBeNull();
    });
    expect(repo.listGroups()).toHaveLength(before - 1);
  });

  it('cancelling confirmation keeps the group', async () => {
    const repo = makeRepo();
    const before = repo.listGroups().length;
    const { findAllByLabelText, findByText } = await renderScreen(repo);
    const familyDelete = (await findAllByLabelText(/Delete group/)).find((b) =>
      b.props.accessibilityLabel?.includes('Family'),
    )!;
    fireEvent.press(familyDelete);
    fireEvent.press(await findByText('Cancel'));
    expect(repo.listGroups()).toHaveLength(before);
  });
});