import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('scaffold', () => {
  it('renders a minimal tree', async () => {
    const { findByText } = await render(<Text>Birthday Reminder</Text>);
    expect(await findByText('Birthday Reminder')).toBeTruthy();
  });
});
