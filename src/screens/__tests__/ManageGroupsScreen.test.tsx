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
    const { findByText } = await renderScreen(repo);
    const prompt = await findByText(/No groups yet\. Tap \+ to create your first group\./);
    expect(prompt).toBeTruthy();
  });
});

describe('ManageGroupsScreen — list', () => {
  it('renders a row per group with name and people count', async () => {
    const repo = makeRepo();
    const family = repo.createGroup({ name: 'Family' });
    const work = repo.createGroup({ name: 'Work' });
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
    repo.createGroup({ name: 'Family' });
    const { findAllByLabelText } = await renderScreen(repo);
    const buttons = await findAllByLabelText(/Delete group/);
    expect(buttons).toHaveLength(1);
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
    const { getByLabelText, findByPlaceholderText, findByText, queryByText } =
      await renderScreen(repo);

    fireEvent.press(getByLabelText('Add group'));
    const input = await findByPlaceholderText('Group name');
    fireEvent.changeText(input, 'Friends');
    fireEvent.press(await findByText('Add'));

    await waitFor(() => {
      expect(queryByText('New Group')).toBeNull();
    });
    expect(repo.listGroups().map((g) => g.name)).toEqual(['Friends']);
  });

  it('does not create a group for an empty or whitespace name', async () => {
    const repo = makeRepo();
    const { getByLabelText, findByPlaceholderText, findByText } = await renderScreen(repo);
    fireEvent.press(getByLabelText('Add group'));
    const input = await findByPlaceholderText('Group name');
    fireEvent.changeText(input, '   ');
    const addButton = await findByText('Add');
    fireEvent.press(addButton);
    expect(repo.listGroups()).toEqual([]);
    expect(await findByText('New Group')).toBeTruthy();
  });

  it('does not create a duplicate group with the same (trimmed) name', async () => {
    const repo = makeRepo();
    repo.createGroup({ name: 'Family' });
    const { getByLabelText, findByPlaceholderText, findByText } = await renderScreen(repo);
    fireEvent.press(getByLabelText('Add group'));
    const input = await findByPlaceholderText('Group name');
    fireEvent.changeText(input, '  Family  ');
    fireEvent.press(await findByText('Add'));
    expect(repo.listGroups()).toHaveLength(1);
  });

  it('cancel dismisses the dialog without creating a group', async () => {
    const repo = makeRepo();
    const { getByLabelText, findByText } = await renderScreen(repo);
    fireEvent.press(getByLabelText('Add group'));
    fireEvent.press(await findByText('Cancel'));
    expect(repo.listGroups()).toEqual([]);
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
    const { getByLabelText, findByPlaceholderText, findByText, findAllByText } =
      await renderScreen(repo);
    fireEvent.press(getByLabelText('Add group'));
    const input = await findByPlaceholderText('Group name');
    fireEvent.changeText(input, 'Friends');
    fireEvent.press(await findByText('Add'));
    expect(await findByText('Friends')).toBeTruthy();
    expect((await findAllByText('0 people')).length).toBeGreaterThanOrEqual(1);
  });
});

describe('ManageGroupsScreen — delete flow', () => {
  it('opens a confirmation dialog when trash is pressed', async () => {
    const repo = makeRepo();
    repo.createGroup({ name: 'Family' });
    const { findAllByLabelText, findByText } = await renderScreen(repo);
    const [deleteBtn] = await findAllByLabelText(/Delete group/);
    fireEvent.press(deleteBtn);
    expect(await findByText(/Delete "Family"\?/)).toBeTruthy();
  });

  it('deletes the group on confirm and removes it from the list', async () => {
    const repo = makeRepo();
    repo.createGroup({ name: 'Family' });
    repo.createGroup({ name: 'Work' });
    const { findAllByLabelText, findByText, queryByText } = await renderScreen(repo);
    const [deleteBtn] = await findAllByLabelText(/Delete group/);
    fireEvent.press(deleteBtn);
    fireEvent.press(await findByText('Delete'));
    await waitFor(() => {
      expect(queryByText('Family')).toBeNull();
    });
    expect(repo.listGroups().map((g) => g.name)).toEqual(['Work']);
  });

  it('cancelling confirmation keeps the group', async () => {
    const repo = makeRepo();
    repo.createGroup({ name: 'Family' });
    const { findAllByLabelText, findByText } = await renderScreen(repo);
    const [deleteBtn] = await findAllByLabelText(/Delete group/);
    fireEvent.press(deleteBtn);
    fireEvent.press(await findByText('Cancel'));
    expect(repo.listGroups()).toHaveLength(1);
  });
});