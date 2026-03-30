import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import { createTestQueryClient } from '@/test/utils';
import { useAuthStore } from '@stores/auth.store';

describe('integration register flow', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      authInitialized: true
    });
  });

  it('renders public register route and redirects back to login with success state', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={['/register']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Public self-signup')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Họ tên'), { target: { value: 'Route Register' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'route@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'User@12345' } });
    fireEvent.change(screen.getByPlaceholderText('Passport number'), { target: { value: 'B1234567' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký tài khoản' }));

    await waitFor(() => {
      expect(screen.getByText('Đăng ký thành công')).toBeInTheDocument();
      expect(screen.getByDisplayValue('route@example.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
    });
  });
});
