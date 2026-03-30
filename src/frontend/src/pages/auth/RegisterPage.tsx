import { IdcardOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Form, Input, InputNumber, Select, Space, Typography } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useRegister } from '@hooks/useAuth';
import { PassengerType } from '@/types/enums';
import { registerFormSchema } from '@utils/validation';

const { Title, Text } = Typography;

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const passengerTypeOptions = [
  { label: 'Unknown', value: PassengerType.UNKNOWN },
  { label: 'Male', value: PassengerType.MALE },
  { label: 'Female', value: PassengerType.FEMALE },
  { label: 'Baby', value: PassengerType.BABY }
];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passportNumber: '',
      age: 18,
      passengerType: PassengerType.UNKNOWN
    }
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background:
          'radial-gradient(circle at top left, rgba(15, 108, 189, 0.18) 0%, rgba(15, 108, 189, 0) 32%), radial-gradient(circle at right center, rgba(19, 144, 140, 0.16) 0%, rgba(19, 144, 140, 0) 34%), linear-gradient(135deg, #f4f8fc 0%, #edf5fb 100%)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1180,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 20
        }}
      >
        <Card
          className="app-surface"
          style={{
            borderRadius: 28,
            overflow: 'hidden',
            minHeight: 620,
            background:
              'linear-gradient(140deg, rgba(15,108,189,0.94) 0%, rgba(19,144,140,0.9) 52%, rgba(7,30,49,0.92) 100%)'
          }}
          styles={{ body: { height: '100%', padding: 32 } }}
        >
          <div style={{ display: 'flex', height: '100%', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'grid', gap: 18 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  width: 'fit-content',
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.14)',
                  color: '#e8fbff',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: 12
                }}
              >
                <SafetyCertificateOutlined />
                SkyBooking
              </div>

              <Title level={1} style={{ color: '#ffffff', margin: 0, maxWidth: 520 }}>
                Tạo tài khoản hành khách
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 20, lineHeight: 1.6, maxWidth: 540 }}>
                Bắt đầu đặt vé với hồ sơ hành khách của riêng bạn
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 1.8, maxWidth: 540 }}>
                Thông tin bạn khai ở đây sẽ được dùng để đồng bộ passenger profile cho luồng booking ngay sau khi đăng nhập.
              </Text>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 14,
                padding: 24,
                borderRadius: 24,
                background: 'rgba(5, 19, 31, 0.22)',
                border: '1px solid rgba(255,255,255,0.16)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: 700 }}>V1 defaults</Text>
              <Text style={{ color: 'rgba(255,255,255,0.82)' }}>Sau khi đăng ký, hệ thống sẽ đưa bạn về trang đăng nhập.</Text>
              <Text style={{ color: 'rgba(255,255,255,0.82)' }}>Email verification chưa bị enforce ở bước login trong phiên bản này.</Text>
              <Text style={{ color: 'rgba(255,255,255,0.82)' }}>Passenger profile sẽ được đồng bộ nền khi bạn bắt đầu booking.</Text>
            </div>
          </div>
        </Card>

        <Card className="app-surface" style={{ borderRadius: 28 }} styles={{ body: { padding: 28 } }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text className="page-eyebrow">Register</Text>
            <Title level={3} style={{ marginBottom: 4 }}>
              Public self-signup
            </Title>
            <Text type="secondary">Tạo tài khoản user để đăng nhập và đặt vé</Text>
          </Space>

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ marginTop: 24 }}>
            <Form.Item label="Họ tên" validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} prefix={<UserOutlined />} placeholder="Họ tên" size="large" />}
              />
            </Form.Item>

            <Form.Item label="Email" validateStatus={errors.email ? 'error' : undefined} help={errors.email?.message}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input {...field} prefix={<MailOutlined />} placeholder="Email" size="large" />}
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              validateStatus={errors.password ? 'error' : undefined}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password {...field} prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Passport"
              validateStatus={errors.passportNumber ? 'error' : undefined}
              help={errors.passportNumber?.message}
            >
              <Controller
                name="passportNumber"
                control={control}
                render={({ field }) => (
                  <Input {...field} prefix={<IdcardOutlined />} placeholder="Passport number" size="large" />
                )}
              />
            </Form.Item>

            <Form.Item label="Tuổi" validateStatus={errors.age ? 'error' : undefined} help={errors.age?.message}>
              <Controller
                name="age"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    size="large"
                    min={0}
                    style={{ width: '100%' }}
                    value={field.value}
                    onChange={(value) => field.onChange(Number(value || 0))}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Loại hành khách"
              validateStatus={errors.passengerType ? 'error' : undefined}
              help={errors.passengerType?.message}
            >
              <Controller
                name="passengerType"
                control={control}
                render={({ field }) => (
                  <Select
                    size="large"
                    value={field.value}
                    onChange={field.onChange}
                    options={passengerTypeOptions}
                  />
                )}
              />
            </Form.Item>

            <Button
              htmlType="submit"
              type="primary"
              size="large"
              block
              loading={registerMutation.isPending}
              style={{ marginTop: 8 }}
            >
              Đăng ký tài khoản
            </Button>

            <Space
              align="center"
              style={{ width: '100%', justifyContent: 'space-between', marginTop: 12 }}
            >
              <Text type="secondary">Đã có tài khoản?</Text>
              <Button type="link" onClick={() => navigate('/login')} style={{ paddingInline: 0 }}>
                Quay về đăng nhập
              </Button>
            </Space>
          </Form>
        </Card>
      </div>
    </div>
  );
};
