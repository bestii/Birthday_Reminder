import { fireEvent, render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

import { HomeScreen, type HomeNavigationTarget } from '../HomeScreen';
import { ThemeProvider } from '../../theme/ThemeContext';
import { createNodeSqliteConnection } from '../../db/node-adapter';
import { migrate } from '../../db/migrate';
import { Repository } from '../../db/repository';
import { DatabaseSync } from 'node:sqlite';

function makeRepo(): Repository {
  const db = new DatabaseSync(':memory:');
  const conn = createNodeSqliteConnection(db);
  migrate(conn);
  return new Repository(conn);
}

async function renderHome(
  repo: Repository,
  onNavigate: (target: HomeNavigationTarget) => void = () => {},
) {
  return render(
    <ThemeProvider>
      <PaperProvider>
        <HomeScreen repository={repo} onNavigate={onNavigate} />
      </PaperProvider>
    </ThemeProvider>,
  );
}

describe('HomeScreen — header', () => {
  it('renders the menu, search, and filter icons', async () => {
    const repo = makeRepo();
    const { getByLabelText } = await renderHome(repo);
    expect(getByLabelText('Open menu')).toBeTruthy();
    expect(getByLabelText('Search')).toBeTruthy();
    expect(getByLabelText('Filter')).toBeTruthy();
  });
});

describe('HomeScreen — empty state', () => {
  it('shows a clear empty-state prompt when no people exist', async () => {
    const repo = makeRepo();
    const { findByText } = await renderHome(repo);
    const prompt = await findByText(/no birthdays yet/i);
    expect(prompt).toBeTruthy();
  });

  it('does not show the empty state once a person exists', async () => {
    const repo = makeRepo();
    repo.createPerson({ name: 'Ada' });
    const { queryByText, getByText } = await renderHome(repo);
    expect(queryByText(/no birthdays yet/i)).toBeNull();
    expect(getByText('Ada')).toBeTruthy();
  });

  it('tap-to-add in the empty state opens the FAB and triggers navigation', async () => {
    const repo = makeRepo();
    const navigated: HomeNavigationTarget[] = [];
    const { getByLabelText } = await renderHome(repo, (target) => navigated.push(target));
    const addCta = getByLabelText('Add a birthday');
    fireEvent.press(addCta);
    expect(navigated).toEqual(['AddBirthday']);
  });
});

describe('HomeScreen — group pills', () => {
  it('renders the seeded default pills (Friends, Family, Work) on first install', async () => {
    const repo = makeRepo();
    const { getByTestId, getByText } = await renderHome(repo);
    expect(getByTestId('group-pills')).toBeTruthy();
    expect(getByText('Friends')).toBeTruthy();
    expect(getByText('Family')).toBeTruthy();
    expect(getByText('Work')).toBeTruthy();
  });

  it('renders a chip for each existing group', async () => {
    const repo = makeRepo();
    repo.createGroup({ name: 'Coworkers' });
    const { getByTestId, getByText } = await renderHome(repo);
    expect(getByTestId('group-pills')).toBeTruthy();
    expect(getByText('Coworkers')).toBeTruthy();
  });
});

describe('HomeScreen — FAB', () => {
  it('shows the toggle FAB by default', async () => {
    const repo = makeRepo();
    const { getByLabelText } = await renderHome(repo);
    expect(getByLabelText('Toggle add menu')).toBeTruthy();
  });

  it('expands to show Add New, Add Event Category, and Manage Groups after pressing the FAB', async () => {
    const repo = makeRepo();
    const { getByLabelText, queryByLabelText } = await renderHome(repo);
    expect(queryByLabelText('Add New')).toBeNull();
    expect(queryByLabelText('Add Event Category')).toBeNull();
    expect(queryByLabelText('Manage Groups')).toBeNull();
    await fireEvent.press(getByLabelText('Toggle add menu'));
    expect(getByLabelText('Add New')).toBeTruthy();
    expect(getByLabelText('Add Event Category')).toBeTruthy();
    expect(getByLabelText('Manage Groups')).toBeTruthy();
  });

  it('pressing an expanded FAB triggers navigation and collapses the FAB', async () => {
    const repo = makeRepo();
    const navigated: HomeNavigationTarget[] = [];
    const { getByLabelText, queryByLabelText } = await renderHome(repo, (target) => navigated.push(target));
    await fireEvent.press(getByLabelText('Toggle add menu'));
    await fireEvent.press(getByLabelText('Manage Groups'));
    expect(navigated).toEqual(['ManageGroups']);
    expect(queryByLabelText('Add Event Category')).toBeNull();
  });

  it('pressing the FAB again collapses the expanded items', async () => {
    const repo = makeRepo();
    const { getByLabelText, queryByLabelText } = await renderHome(repo);
    await fireEvent.press(getByLabelText('Toggle add menu'));
    expect(getByLabelText('Add New')).toBeTruthy();
    await fireEvent.press(getByLabelText('Toggle add menu'));
    expect(queryByLabelText('Add New')).toBeNull();
  });
});

describe('HomeScreen — hamburger menu', () => {
  it('shows the menu entries Settings, Notifications, and Backup when opened', async () => {
    const repo = makeRepo();
    const navigated: HomeNavigationTarget[] = [];
    const { getByLabelText, getByText } = await renderHome(repo, (target) => navigated.push(target));
    await fireEvent.press(getByLabelText('Open menu'));
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Backup')).toBeTruthy();
  });

  it('tapping Settings triggers Settings navigation', async () => {
    const repo = makeRepo();
    const navigated: HomeNavigationTarget[] = [];
    const { getByLabelText, getByText } = await renderHome(repo, (target) => navigated.push(target));
    await fireEvent.press(getByLabelText('Open menu'));
    await fireEvent.press(getByText('Settings'));
    expect(navigated).toEqual(['Settings']);
  });

  it('tapping Notifications triggers Notifications navigation', async () => {
    const repo = makeRepo();
    const navigated: HomeNavigationTarget[] = [];
    const { getByLabelText, getByText } = await renderHome(repo, (target) => navigated.push(target));
    await fireEvent.press(getByLabelText('Open menu'));
    await fireEvent.press(getByText('Notifications'));
    expect(navigated).toEqual(['Notifications']);
  });

  it('tapping Backup triggers Backup navigation', async () => {
    const repo = makeRepo();
    const navigated: HomeNavigationTarget[] = [];
    const { getByLabelText, getByText } = await renderHome(repo, (target) => navigated.push(target));
    await fireEvent.press(getByLabelText('Open menu'));
    await fireEvent.press(getByText('Backup'));
    expect(navigated).toEqual(['Backup']);
  });
});