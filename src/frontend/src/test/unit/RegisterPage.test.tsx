import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from '@pages/auth/RegisterPage';
import { PassengerType } from '@/types/enums';
import { createTestWrapper } from '@/test/utils';

const mutate = vi.fn();

vi.mock('@hooks/useAuth', () => ({
  useLogin: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false
  }),
  useRegister: () => ({
    mutate,
    isPending: false,
    isError: false
  })
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it('should render register form without role field', () => {
    render(<RegisterPage />, { wrapper: createTestWrapper() });

    expect(screen.getByPlaceholderText('Họ tên')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mật khẩu')).toBeInTheDocument();
    expect(screen.queryByLabelText('Vai trò')).not.toBeInTheDocument();
  });

  it('should submit register payload without role', async () => {
    render(<RegisterPage />, { wrapper: createTestWrapper() });

    fireEvent.change(screen.getByPlaceholderText('Họ tên'), { target: { value: 'Register User' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'register@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'User@12345' } });
    fireEvent.change(screen.getByPlaceholderText('Passport number'), { target: { value: 'B1234567' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '23' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký tài khoản' }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        name: 'Register User',
        email: 'register@example.com',
        password: 'User@12345',
        passportNumber: 'B1234567',
        age: 23,
        passengerType: PassengerType.UNKNOWN
      });
    });
  });
});
