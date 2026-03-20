import { Alert, Button, Col, Form, Input, InputNumber, Row, Space, Table, Typography } from 'antd';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@components/common/PageHeader';
import { SectionCard } from '@components/common/SectionCard';
import { StatusPill } from '@components/common/StatusPill';
import { useCreateWalletTopupRequest, useGetMyWalletTopupRequests, useGetWalletMe } from '@hooks/usePayments';
import { WalletTopupRequestStatus } from '@/types/enums';
import { CreateWalletTopupRequest, WalletTopupRequestDto } from '@/types/payment.types';
import { formatCurrency, formatDateTime } from '@utils/format';
import { normalizeProblemError } from '@utils/helpers';

const { Text } = Typography;

const topupStatusTone: Record<WalletTopupRequestStatus, 'success' | 'warning' | 'danger'> = {
  [WalletTopupRequestStatus.PENDING]: 'warning',
  [WalletTopupRequestStatus.APPROVED]: 'success',
  [WalletTopupRequestStatus.REJECTED]: 'danger'
};

const topupStatusLabel: Record<WalletTopupRequestStatus, string> = {
  [WalletTopupRequestStatus.PENDING]: 'Chờ duyệt',
  [WalletTopupRequestStatus.APPROVED]: 'Đã duyệt',
  [WalletTopupRequestStatus.REJECTED]: 'Đã từ chối'
};

export const WalletPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<CreateWalletTopupRequest>();
  const walletQuery = useGetWalletMe(true);
  const myTopupsQuery = useGetMyWalletTopupRequests(true);
  const createTopupMutation = useCreateWalletTopupRequest();
  const topupRequests = Array.isArray(myTopupsQuery.data) ? myTopupsQuery.data : [];
  const walletError = walletQuery.isError ? normalizeProblemError(walletQuery.error) : null;
  const topupsError = myTopupsQuery.isError ? normalizeProblemError(myTopupsQuery.error) : null;
  const hasWalletDataError = Boolean(walletError || topupsError);
  const walletDataErrorDescription = [walletError?.message, topupsError?.message]
    .filter((message): message is string => Boolean(message))
    .join(' | ');

  const pendingCount = useMemo(
    () =>
      topupRequests.filter((request) => request.status === WalletTopupRequestStatus.PENDING).length,
    [topupRequests]
  );

  const handleSubmitTopupRequest = async (values: CreateWalletTopupRequest) => {
    await createTopupMutation.mutateAsync({
      amount: Number(values.amount),
      transferContent: values.transferContent.trim(),
      providerTxnId: values.providerTxnId.trim()
    });

    form.resetFields();
  };

  return (
    <>
      <PageHeader
        eyebrow="Wallet"
        title="Ví của tôi"
        subtitle="Số dư ví bắt đầu từ 0. Tạo yêu cầu nạp ví và chờ admin duyệt thủ công."
        onBack={() => navigate('/dashboard')}
      />

      {hasWalletDataError && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải dữ liệu ví"
          description={
            walletDataErrorDescription || 'Dữ liệu trả về từ hệ thống không đúng định dạng mong đợi. Vui lòng thử lại.'
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <SectionCard title="Số dư ví" subtitle="Số tiền khả dụng để thanh toán booking">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text style={{ fontSize: 32, fontWeight: 800 }}>
                {formatCurrency(walletQuery.data?.balance || 0, walletQuery.data?.currency || 'VND')}
              </Text>
              <Text type="secondary">{`Yêu cầu chờ duyệt: ${pendingCount}/3`}</Text>
              <Space wrap>
                <Button onClick={() => walletQuery.refetch()} loading={walletQuery.isFetching}>
                  Refresh số dư
                </Button>
                <Button onClick={() => myTopupsQuery.refetch()} loading={myTopupsQuery.isFetching}>
                  Refresh yêu cầu
                </Button>
              </Space>
            </Space>
          </SectionCard>

          <SectionCard title="Tạo yêu cầu nạp ví" subtitle="Nhập thông tin chuyển khoản để admin đối soát">
            <Form<CreateWalletTopupRequest> layout="vertical" form={form} onFinish={handleSubmitTopupRequest}>
              <Form.Item
                label="Số tiền nạp"
                name="amount"
                rules={[{ required: true, message: 'Vui lòng nhập số tiền nạp' }]}
              >
                <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="VD: 500000" />
              </Form.Item>

              <Form.Item
                label="Mã giao dịch ngân hàng (providerTxnId)"
                name="providerTxnId"
                rules={[{ required: true, message: 'Vui lòng nhập mã giao dịch' }]}
              >
                <Input placeholder="VD: VCB-20260320-0001" />
              </Form.Item>

              <Form.Item
                label="Nội dung chuyển khoản"
                name="transferContent"
                rules={[{ required: true, message: 'Vui lòng nhập nội dung chuyển khoản' }]}
              >
                <Input.TextArea rows={4} placeholder="VD: TOPUP USER NGUYEN VAN A" />
              </Form.Item>

              <Space wrap>
                <Button type="primary" htmlType="submit" loading={createTopupMutation.isPending}>
                  Gửi yêu cầu nạp ví
                </Button>
                <Button onClick={() => form.resetFields()} disabled={createTopupMutation.isPending}>
                  Xóa form
                </Button>
              </Space>
            </Form>
          </SectionCard>
        </Col>

        <Col xs={24} xl={14}>
          <SectionCard title="Lịch sử yêu cầu nạp ví" subtitle="Theo dõi trạng thái duyệt và lý do từ chối (nếu có)">
            {pendingCount >= 3 && (
              <Alert
                type="warning"
                showIcon
                message="Bạn đang có 3 yêu cầu chờ duyệt"
                description="Vui lòng đợi admin xử lý bớt trước khi tạo yêu cầu mới."
                style={{ marginBottom: 16 }}
              />
            )}

            <Table<WalletTopupRequestDto>
              rowKey="id"
              loading={myTopupsQuery.isFetching}
              dataSource={topupRequests}
              pagination={{ pageSize: 8, showSizeChanger: true }}
              columns={[
                {
                  title: 'Request',
                  key: 'request',
                  render: (_, record) => (
                    <Space direction="vertical" size={4}>
                      <Text strong>{`#${record.id}`}</Text>
                      <StatusPill label={topupStatusLabel[record.status]} tone={topupStatusTone[record.status]} subtle />
                    </Space>
                  )
                },
                {
                  title: 'Số tiền',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (value: number, record) => <Text strong>{formatCurrency(value, record.currency)}</Text>
                },
                {
                  title: 'Mã giao dịch',
                  dataIndex: 'providerTxnId',
                  key: 'providerTxnId',
                  render: (value: string) => (
                    <Text style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>{value}</Text>
                  )
                },
                {
                  title: 'Nội dung CK',
                  dataIndex: 'transferContent',
                  key: 'transferContent'
                },
                {
                  title: 'Thời điểm',
                  key: 'time',
                  render: (_, record) => (
                    <Space direction="vertical" size={4}>
                      <Text type="secondary">{`Tạo lúc: ${formatDateTime(record.createdAt)}`}</Text>
                      <Text type="secondary">{`Review lúc: ${formatDateTime(record.reviewedAt)}`}</Text>
                    </Space>
                  )
                },
                {
                  title: 'Ghi chú',
                  key: 'note',
                  render: (_, record) =>
                    record.rejectionReason ? <Text type="danger">{record.rejectionReason}</Text> : <Text type="secondary">-</Text>
                }
              ]}
            />
          </SectionCard>
        </Col>
      </Row>
    </>
  );
};
