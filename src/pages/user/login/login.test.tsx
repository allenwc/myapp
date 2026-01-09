import { startMock } from '@@/requestRecordMock';
import { TestBrowser } from '@@/testBrowser';
import { fireEvent, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { act } from 'react';

jest.mock('@/services/supabase/client', () => {
  const user = {
    id: 'test-user-id',
    email: 'admin@example.com',
    user_metadata: { name: 'Admin' },
    app_metadata: { role: 'user' },
  };

  return {
    getSupabaseClient: () => ({
      auth: {
        signInWithPassword: async () => ({ data: { user }, error: null }),
        getUser: async () => ({ data: { user }, error: null }),
        signOut: async () => ({ error: null }),
      },
    }),
  };
});

let server: {
  close: () => void;
};

describe('Login Page', () => {
  beforeAll(async () => {
    server = await startMock({
      port: 8000,
      scene: 'login',
    });
  });

  afterAll(() => {
    server?.close();
  });

  it('should show login form', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    await rootContainer.findAllByText('Ant Design');

    act(() => {
      historyRef.current?.push('/user/login');
    });

    expect(
      rootContainer.baseElement?.querySelector('.ant-pro-form-login-desc')
        ?.textContent,
    ).toBe(
      'Ant Design is the most influential web design specification in Xihu district',
    );

    expect(rootContainer.asFragment()).toMatchSnapshot();

    rootContainer.unmount();
  });

  it('should login success', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    await rootContainer.findAllByText('Ant Design');

    const userNameInput = await rootContainer.findByPlaceholderText(
      'Username: admin or user',
    );

    act(() => {
      fireEvent.change(userNameInput, { target: { value: 'admin' } });
    });

    const passwordInput = await rootContainer.findByPlaceholderText(
      'Password: ant.design',
    );

    act(() => {
      fireEvent.change(passwordInput, { target: { value: 'ant.design' } });
    });

    await (await rootContainer.findByText('Login')).click();

    await waitFor(() => {
      expect(historyRef.current?.location?.pathname).toBe(
        '/dashboard/analysis',
      );
    });

    expect(rootContainer.asFragment()).toMatchSnapshot();

    rootContainer.unmount();
  });
});
